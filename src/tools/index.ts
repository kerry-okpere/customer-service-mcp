import { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AssignAgentInput, GetAgentPerformanceCardInput, GreetInput, VipCustomersInput } from "./types.js";
import {
  assignAgentToCustomer,
  getAgentPerformanceCard,
  getAvailableAgents,
  getVipCustomers,
} from "../lambdas.js";


// Implement get_vip_customers resource callback

export const greeting: ToolCallback<typeof GreetInput> = async ({ name }) => {
  return {
    content: [
      {
        type: "text",
        text: `Hello ${name || "world"}! Welcome to the customer service MCP example. This tool demonstrates how to create a simple greeting based on user input. You can customize the greeting by providing different names in the input.`,
      },
    ],
  };
};