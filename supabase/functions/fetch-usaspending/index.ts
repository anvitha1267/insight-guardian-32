import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const USA_SPENDING_API = "https://api.usaspending.gov/api/v2";
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Top federal-spending states (broad geographic mix, high obligation volume).
const STATES: Array<{ code: string; label: string }> = [
  { code: "CA", label: "California" },
  { code: "TX", label: "Texas" },
  { code: "VA", label: "Virginia" },
  { code: "NY", label: "New York" },
  { code: "FL", label: "Florida" },
  { code: "MD", label: "Maryland" },
  { code: "PA", label: "Pennsylvania" },
  { code: "WA", label: "Washington" },
  { code: "MA", label: "Massachusetts" },
  { code: "GA", label: "Georgia" },
  { code: "OH", label: "Ohio" },
  { code: "IL", label: "Illinois" },
  { code: "CT", label: "Connecticut" },
  { code: "AZ", label: "Arizona" },
];

interface SpendingRow {
  date: string;
  amount: number;
  category: string;
  is_anomaly: boolean;
  expected: number;
}

async function fetchStateMonthly(stateCode: string, startDate: string, endDate: string) {
  const res = await fetch(`${USA_SPENDING_API}/search/spending_over_time/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      group: "month",
      filters: {
        place_of_performance_locations: [{ country: "USA", state: stateCode }],
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

    // Fetch monthly time series per state in parallel
    const perStateResults = await Promise.all(
      STATES.map((s) => fetchStateMonthly(s.code, startDate, endDate))
    );

    const spendingRows: SpendingRow[] = [];
    STATES.forEach((state, idx) => {
      const monthly = perStateResults[idx];
      for (const r of monthly) {
        const monthIdx = (r.time_period?.month ?? 1) - 1;
        const year = r.time_period?.fiscal_year ?? r.time_period?.year ?? currentYear;
        const dateLabel = `${MONTH_NAMES[monthIdx]} ${String(year).slice(-2)}`;
        const amount = Math.round(Math.abs(r.aggregated_amount || 0));
        if (amount === 0) continue;
        spendingRows.push({
          date: dateLabel,
          amount,
          category: state.label,
          is_anomaly: false,
          expected: 0,
        });
      }
    });

    if (spendingRows.length === 0) {
      throw new Error("No spending data points returned from USAspending.gov");
    }

    // Anomaly detection per state (>1.5 std dev from that state's monthly mean)
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

    // Clear and insert
    await supabase.from("spending_data").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("ai_insights").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    for (let i = 0; i < spendingRows.length; i += 100) {
      const { error } = await supabase.from("spending_data").insert(spendingRows.slice(i, i + 100));
      if (error) throw new Error(`Insert spending_data: ${error.message}`);
    }

    // Build insights
    const anomalies = spendingRows.filter((r) => r.is_anomaly);
    const insights: Array<{ severity: string; title: string; description: string; recommendation: string }> = [];

    const sortedAnomalies = anomalies
      .sort((a, b) => Math.abs(b.amount - b.expected) - Math.abs(a.amount - a.expected))
      .slice(0, 5);

    for (const a of sortedAnomalies) {
      const dev = a.expected > 0 ? Math.round(((a.amount - a.expected) / a.expected) * 100) : 0;
      insights.push({
        severity: Math.abs(dev) > 100 ? "critical" : "warning",
        title: `${a.category} — ${a.date} Anomaly`,
        description: `${a.category} federal spending of $${(a.amount / 1e9).toFixed(2)}B in ${a.date} is ${Math.abs(dev)}% ${dev > 0 ? "above" : "below"} the state's monthly average of $${(a.expected / 1e9).toFixed(2)}B.`,
        recommendation: `Investigate obligations in ${a.category} during ${a.date} — review the specific awards driving the deviation.`,
      });
    }

    const totals = Object.entries(byCategory).map(([cat, rows]) => ({
      category: cat,
      total: rows.reduce((s, r) => s + r.amount, 0),
    })).sort((a, b) => b.total - a.total);

    if (totals[0]) {
      insights.push({
        severity: "info",
        title: `Largest Recipient State: ${totals[0].category}`,
        description: `${totals[0].category} received $${(totals[0].total / 1e9).toFixed(1)}B in federal obligations across the period — the largest of the ${totals.length} tracked states.`,
        recommendation: "Track this state's monthly cadence to flag future deviations early.",
      });
    }

    insights.push({
      severity: "success",
      title: "Multi-State Data Synced",
      description: `Imported ${spendingRows.length} monthly records across ${Object.keys(byCategory).length} states from USAspending.gov (${startDate} to ${endDate}).`,
      recommendation: "Re-import periodically to capture the latest federal obligations.",
    });

    const { error: insErr } = await supabase.from("ai_insights").insert(insights);
    if (insErr) throw new Error(`Insert ai_insights: ${insErr.message}`);

    return new Response(
      JSON.stringify({
        success: true,
        records: spendingRows.length,
        states: Object.keys(byCategory).length,
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
