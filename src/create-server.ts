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

  server.registerTool(
    "greeting",
    {
      description: "Get a greeting message",
      inputSchema: GreetInput,
    },
    greeting,
  );

  return { server };
};
