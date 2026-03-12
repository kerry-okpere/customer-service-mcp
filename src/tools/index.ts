import { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GreetInput } from "./types.js";

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
