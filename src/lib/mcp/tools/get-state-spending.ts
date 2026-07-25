import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "get_state_spending",
  title: "Get state spending",
  description:
    "Get monthly federal spending records (date, amount, expected, is_anomaly) for a given US state.",
  inputSchema: {
    state: z
      .string()
      .min(2)
      .describe("Full state name as stored (e.g. 'California', 'Texas', 'Connecticut')."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ state }) => {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!);
    const { data, error } = await supabase
      .from("spending_data")
      .select("date, amount, expected, is_anomaly")
      .eq("category", state);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { state, records: data ?? [] },
    };
  },
});
