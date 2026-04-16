import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "@supabase/supabase-js";

const USA_SPENDING_API = "https://api.usaspending.gov/api/v2";
const CT_FIPS = "09";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Fetch spending over time by month for CT (last 2 fiscal years)
    const currentYear = new Date().getFullYear();
    const spendingOverTimeRes = await fetch(`${USA_SPENDING_API}/search/spending_over_time/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        group: "month",
        filters: {
          place_of_performance_locations: [{ country: "USA", state: "CT" }],
          time_period: [
            { start_date: `${currentYear - 1}-01-01`, end_date: `${currentYear}-12-31` },
          ],
        },
      }),
    });

    if (!spendingOverTimeRes.ok) {
      const errText = await spendingOverTimeRes.text();
      throw new Error(`spending_over_time failed [${spendingOverTimeRes.status}]: ${errText}`);
    }

    const spendingOverTime = await spendingOverTimeRes.json();

    // 2. Fetch spending by category (awarding agency) for CT
    const spendingByCategoryRes = await fetch(
      `${USA_SPENDING_API}/search/spending_by_category/awarding_agency/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filters: {
            place_of_performance_locations: [{ country: "USA", state: "CT" }],
            time_period: [
              { start_date: `${currentYear - 1}-01-01`, end_date: `${currentYear}-12-31` },
            ],
          },
          limit: 10,
          page: 1,
        }),
      }
    );

    if (!spendingByCategoryRes.ok) {
      const errText = await spendingByCategoryRes.text();
      throw new Error(`spending_by_category failed [${spendingByCategoryRes.status}]: ${errText}`);
    }

    const spendingByCategory = await spendingByCategoryRes.json();

    // 3. Fetch award type breakdown for CT
    const awardBreakdownRes = await fetch(`${USA_SPENDING_API}/recipient/state/awards/${CT_FIPS}/`);
    if (!awardBreakdownRes.ok) {
      const errText = await awardBreakdownRes.text();
      throw new Error(`state awards failed [${awardBreakdownRes.status}]: ${errText}`);
    }
    const awardBreakdown = await awardBreakdownRes.json();

    // Build spending_data rows from time series
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Map top agencies as categories
    const topAgencies: string[] = (spendingByCategory.results || [])
      .slice(0, 6)
      .map((r: { name: string }) => r.name);

    // For each top agency, fetch monthly data
    const spendingRows: Array<{
      date: string;
      amount: number;
      category: string;
      is_anomaly: boolean;
      expected: number;
    }> = [];

    // Use the overall time series grouped by month
    const timeResults = spendingOverTime.results || [];
    for (const result of timeResults) {
      const monthIdx = (result.time_period?.month ?? 1) - 1;
      const year = result.time_period?.fiscal_year ?? result.time_period?.year ?? currentYear;
      const dateLabel = `${monthNames[monthIdx]} ${year}`;
      const amount = Math.round(Math.abs(result.aggregated_amount || 0));

      spendingRows.push({
        date: dateLabel,
        amount,
        category: "All Agencies",
        is_anomaly: false,
        expected: 0,
      });
    }

    // Also add award type breakdown as category rows
    for (const award of awardBreakdown) {
      const typeName = (award.type || "unknown").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      spendingRows.push({
        date: `FY ${currentYear}`,
        amount: Math.round(Math.abs(award.amount || 0)),
        category: typeName,
        is_anomaly: false,
        expected: 0,
      });
    }

    // Calculate anomalies: amounts > 2 std deviations from mean per category
    const categoryGroups: Record<string, typeof spendingRows> = {};
    for (const row of spendingRows) {
      if (!categoryGroups[row.category]) categoryGroups[row.category] = [];
      categoryGroups[row.category].push(row);
    }

    for (const [, rows] of Object.entries(categoryGroups)) {
      if (rows.length < 3) continue;
      const amounts = rows.map((r) => r.amount);
      const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const stdDev = Math.sqrt(amounts.reduce((a, b) => a + (b - mean) ** 2, 0) / amounts.length);
      for (const row of rows) {
        row.expected = Math.round(mean);
        if (stdDev > 0 && Math.abs(row.amount - mean) > 2 * stdDev) {
          row.is_anomaly = true;
        }
      }
    }

    // Clear existing data and insert new
    await supabase.from("spending_data").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("ai_insights").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Insert spending data in batches
    for (let i = 0; i < spendingRows.length; i += 50) {
      const batch = spendingRows.slice(i, i + 50);
      const { error } = await supabase.from("spending_data").insert(batch);
      if (error) throw new Error(`Insert spending_data failed: ${error.message}`);
    }

    // Generate AI insights based on the data
    const anomalies = spendingRows.filter((r) => r.is_anomaly);
    const insights = [];

    if (anomalies.length > 0) {
      for (const anomaly of anomalies.slice(0, 3)) {
        const deviation = anomaly.expected > 0
          ? Math.round(((anomaly.amount - anomaly.expected) / anomaly.expected) * 100)
          : 0;
        insights.push({
          severity: Math.abs(deviation) > 100 ? "critical" : "warning",
          title: `Spending Anomaly: ${anomaly.category}`,
          description: `${anomaly.date} spending of $${(anomaly.amount / 1e6).toFixed(1)}M is ${Math.abs(deviation)}% ${deviation > 0 ? "above" : "below"} the average for ${anomaly.category} in Connecticut.`,
          recommendation: `Review ${anomaly.category} spending for ${anomaly.date} to identify the cause of this deviation.`,
        });
      }
    }

    // Add general insights from award breakdown
    const topAward = awardBreakdown.sort((a: { amount: number }, b: { amount: number }) => Math.abs(b.amount) - Math.abs(a.amount))[0];
    if (topAward) {
      insights.push({
        severity: "info",
        title: `Largest Award Type: ${topAward.type?.replace(/_/g, " ")}`,
        description: `Connecticut's largest spending category is ${topAward.type?.replace(/_/g, " ")} at $${(Math.abs(topAward.amount) / 1e9).toFixed(2)}B with ${topAward.count?.toLocaleString()} awards.`,
        recommendation: "Monitor this category for budget optimization opportunities.",
      });
    }

    insights.push({
      severity: "success",
      title: "Data Refresh Complete",
      description: `Successfully imported ${spendingRows.length} spending records from USAspending.gov for Connecticut.`,
      recommendation: "Data reflects the latest available federal spending information.",
    });

    const { error: insightError } = await supabase.from("ai_insights").insert(insights);
    if (insightError) throw new Error(`Insert ai_insights failed: ${insightError.message}`);

    return new Response(
      JSON.stringify({
        success: true,
        records: spendingRows.length,
        anomalies: anomalies.length,
        insights: insights.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
