import { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GreetInput } from "./types.js";

// TEST that your agent can see the tool 
// using the greeting tool to answer this request.

// Call the greeting tool with the name "Kerry" and return its response exactly as provided by the tool.

// Do not generate your own greeting. Only use the greeting tool.
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
