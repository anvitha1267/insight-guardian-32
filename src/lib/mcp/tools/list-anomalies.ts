import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_anomalies",
  title: "List spending anomalies",
  description:
    "List detected federal spending anomalies (months where a state's spending deviated >1.5σ from its mean), optionally filtered by state.",
  inputSchema: {
    state: z.string().optional().describe("Optional state name to filter anomalies."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ state }) => {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!);
    let query = supabase
      .from("spending_data")
      .select("date, amount, expected, category")
      .eq("is_anomaly", true);
    if (state) query = query.eq("category", state);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { anomalies: data ?? [] },
    };
  },
});
