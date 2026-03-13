import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GreetInput } from "./tools/types.js";
import { greeting } from "./tools/index.js";

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
