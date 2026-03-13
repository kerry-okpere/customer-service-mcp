import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  AssignAgentInput,
  GetAgentPerformanceCardInput,
  GreetInput,
  VipCustomersInput,
} from "./tools/types.js";
import {
  assignAgent,
  availableAgents,
  getAgentPerformanceCardTool,
  greeting,
  vipCustomers,
} from "./tools/index.js";
import { agentRoster } from "./resources/index.js";
import {
  assignBestAgentPrompt,
  dailyBriefingPrompt,
  explainAssignmentPrompt,
} from "./prompts/index.js";
import { AssignAgentPromptInput, ExplainAssignmentPromptInput } from "./prompts/types.js";

export const createServer = () => {
  const server = new McpServer({
    name: "customer-service-mcp",
    version: "1.0.0",
  });

  // Tools ===========================================================================

  server.registerTool(
    "greeting",
    {
      description: "Get a greeting message",
      inputSchema: GreetInput,
    },
    greeting,
  );

  server.registerTool(
    "get_vip_customers",
    {
      description:
        "Returns the top N customers ranked by total spend who currently have open support tickets.",
      inputSchema: VipCustomersInput,
    },
    vipCustomers,
  );

  server.registerTool(
    "get_available_agents",
    {
      description:
        "Lists all support agents who are currently available and have open capacity, sorted by rating.",
      inputSchema: {},
    },
    availableAgents,
  );

  server.registerTool(
    "assign_agent_to_customer",
    {
      description:
        "Scores all available agents against a customer's profile and assigns the best match. Updates agent load and logs the assignment.",
      inputSchema: AssignAgentInput,
    },
    assignAgent,
  );

  server.registerTool(
    "get_agent_performance_card",
    {
      description:
        "Renders a visual performance card for an agent as an embedded PNG image showing rating, resolution rate, handle time, today's cases, and load.",
      inputSchema: GetAgentPerformanceCardInput,
    },
    getAgentPerformanceCardTool,
  );

  // Resources =======================================================================

  server.registerResource(
    "agents-roster",
    "support://agents/roster",
    {
      mimeType: "text/plain",
    },
    agentRoster,
  );

  // Prompts ==========================================================================
  server.registerPrompt(
    "assign_best_agent",
    {
      argsSchema: AssignAgentPromptInput,
      description:
        "Fetches the top VIP customers with open tickets and assigns the best available agent to each one, with full reasoning.",
    },
    assignBestAgentPrompt,
  );

    server.registerPrompt(
    "explain_assignment",
    {
      argsSchema: ExplainAssignmentPromptInput,
      description:
        "Explains why a specific agent was assigned to a specific customer — shows the full scoring breakdown.",
    },
    explainAssignmentPrompt,
  );

  server.registerPrompt(
    "daily_briefing",
    {
      description:
        "Produces a morning briefing: who are the VIP customers waiting, which agents are ready, and are there any SLA risks.",
    },
    dailyBriefingPrompt,
  );
  return { server };
};
