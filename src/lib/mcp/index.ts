import { defineMcp } from "@lovable.dev/mcp-js";
import listStates from "./tools/list-states";
import getStateSpending from "./tools/get-state-spending";
import listAnomalies from "./tools/list-anomalies";
import listInsights from "./tools/list-insights";

export default defineMcp({
  name: "spendguard-mcp",
  title: "SpendGuard MCP",
  version: "0.1.0",
  instructions:
    "Tools for SpendGuard — read US state federal spending data (from USAspending.gov), detected anomalies, and analytical insights. Use `list_states` to discover available states, `get_state_spending` for monthly time series, `list_anomalies` for flagged deviations, and `list_ai_insights` for narrative analysis.",
  tools: [listStates, getStateSpending, listAnomalies, listInsights],
});
