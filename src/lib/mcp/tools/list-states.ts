import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_states",
  title: "List states",
  description: "List all US states that have federal spending data imported in SpendGuard.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async () => {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!);
    const { data, error } = await supabase.from("spending_data").select("category");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const states = [...new Set((data ?? []).map((r) => r.category))].sort();
    return {
      content: [{ type: "text", text: JSON.stringify(states) }],
      structuredContent: { states },
    };
  },
});
