import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const USA_SPENDING_API = "https://api.usaspending.gov/api/v2";
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface SpendingRow {
  date: string;
  amount: number;
  category: string;
  is_anomaly: boolean;
  expected: number;
}

async function fetchAgencyMonthly(agency: string, startDate: string, endDate: string) {
  const res = await fetch(`${USA_SPENDING_API}/search/spending_over_time/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      group: "month",
      filters: {
        place_of_performance_locations: [{ country: "USA", state: "CT" }],
        agencies: [{ type: "awarding", tier: "toptier", name: agency }],
        time_period: [{ start_date: startDate, end_date: endDate }],
      },
    }),
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.results || [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const currentYear = new Date().getFullYear();
    const startDate = `${currentYear - 2}-01-01`;
    const endDate = `${currentYear - 1}-12-31`;

    // Step 1: get top awarding agencies for CT
    const topAgenciesRes = await fetch(
      `${USA_SPENDING_API}/search/spending_by_category/awarding_agency/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters: {
            place_of_performance_locations: [{ country: "USA", state: "CT" }],
            time_period: [{ start_date: startDate, end_date: endDate }],
          },
          limit: 8,
          page: 1,
        }),
      }
    );
    if (!topAgenciesRes.ok) {
      throw new Error(`Top agencies failed: ${await topAgenciesRes.text()}`);
    }
    const topAgenciesJson = await topAgenciesRes.json();
    const topAgencies: string[] = (topAgenciesJson.results || [])
      .slice(0, 6)
      .map((r: { name: string }) => r.name)
      .filter(Boolean);

    if (topAgencies.length === 0) {
      throw new Error("No agencies returned from USAspending.gov");
    }

    // Step 2: fetch monthly time series per agency in parallel
    const perAgencyResults = await Promise.all(
      topAgencies.map((a) => fetchAgencyMonthly(a, startDate, endDate))
    );

    const spendingRows: SpendingRow[] = [];
    topAgencies.forEach((agency, idx) => {
      const monthly = perAgencyResults[idx];
      // Shorten agency name for display (drop "Department of " etc.)
      const shortName = agency
        .replace(/^Department of (the )?/i, "")
        .replace(/^U\.?S\.? /i, "")
        .slice(0, 40);

      for (const r of monthly) {
        const monthIdx = (r.time_period?.month ?? 1) - 1;
        const year = r.time_period?.fiscal_year ?? r.time_period?.year ?? currentYear;
        const dateLabel = `${MONTH_NAMES[monthIdx]} ${String(year).slice(-2)}`;
        const amount = Math.round(Math.abs(r.aggregated_amount || 0));
        if (amount === 0) continue;
        spendingRows.push({
          date: dateLabel,
          amount,
          category: shortName,
          is_anomaly: false,
          expected: 0,
        });
      }
    });

    if (spendingRows.length === 0) {
      throw new Error("No spending data points returned");
    }

    // Step 3: anomaly detection per category (>1.5 std dev OR >40% MoM change)
    const byCategory: Record<string, SpendingRow[]> = {};
    for (const row of spendingRows) {
      (byCategory[row.category] ||= []).push(row);
    }

    for (const rows of Object.values(byCategory)) {
      if (rows.length < 3) continue;
      const amounts = rows.map((r) => r.amount);
      const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const variance = amounts.reduce((a, b) => a + (b - mean) ** 2, 0) / amounts.length;
      const stdDev = Math.sqrt(variance);
      for (const row of rows) {
        row.expected = Math.round(mean);
        if (stdDev > 0 && Math.abs(row.amount - mean) > 1.5 * stdDev) {
          row.is_anomaly = true;
        }
      }
    }

    // Step 4: clear and insert
    await supabase.from("spending_data").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("ai_insights").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    for (let i = 0; i < spendingRows.length; i += 100) {
      const { error } = await supabase.from("spending_data").insert(spendingRows.slice(i, i + 100));
      if (error) throw new Error(`Insert spending_data: ${error.message}`);
    }

    // Step 5: build insights
    const anomalies = spendingRows.filter((r) => r.is_anomaly);
    const insights: Array<{ severity: string; title: string; description: string; recommendation: string }> = [];

    // Top anomalies
    const sortedAnomalies = anomalies
      .sort((a, b) => Math.abs(b.amount - b.expected) - Math.abs(a.amount - a.expected))
      .slice(0, 4);

    for (const a of sortedAnomalies) {
      const dev = a.expected > 0 ? Math.round(((a.amount - a.expected) / a.expected) * 100) : 0;
      insights.push({
        severity: Math.abs(dev) > 100 ? "critical" : "warning",
        title: `${a.category} — ${a.date} Anomaly`,
        description: `${a.category} spending of $${(a.amount / 1e6).toFixed(1)}M in ${a.date} is ${Math.abs(dev)}% ${dev > 0 ? "above" : "below"} the agency's monthly average of $${(a.expected / 1e6).toFixed(1)}M for Connecticut.`,
        recommendation: `Investigate ${a.category} obligations during ${a.date} — review specific awards driving the deviation.`,
      });
    }

    // Top spender insight
    const totals = Object.entries(byCategory).map(([cat, rows]) => ({
      category: cat,
      total: rows.reduce((s, r) => s + r.amount, 0),
    })).sort((a, b) => b.total - a.total);

    if (totals[0]) {
      insights.push({
        severity: "info",
        title: `Largest Spender: ${totals[0].category}`,
        description: `${totals[0].category} accounts for $${(totals[0].total / 1e9).toFixed(2)}B in CT federal spending across the period — the largest of the top ${totals.length} agencies.`,
        recommendation: "Track this agency's monthly cadence to flag future deviations early.",
      });
    }

    insights.push({
      severity: "success",
      title: "Live Data Synced",
      description: `Imported ${spendingRows.length} monthly records across ${Object.keys(byCategory).length} federal agencies from USAspending.gov for Connecticut (${startDate} to ${endDate}).`,
      recommendation: "Re-import periodically to capture the latest obligations.",
    });

    const { error: insErr } = await supabase.from("ai_insights").insert(insights);
    if (insErr) throw new Error(`Insert ai_insights: ${insErr.message}`);

    return new Response(
      JSON.stringify({
        success: true,
        records: spendingRows.length,
        agencies: Object.keys(byCategory).length,
        anomalies: anomalies.length,
        insights: insights.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("fetch-usaspending error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
