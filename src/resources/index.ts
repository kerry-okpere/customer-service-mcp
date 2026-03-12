import {
  ReadResourceCallback,
} from "@modelcontextprotocol/sdk/server/mcp.js";

export const Resources: ReadResourceCallback = async () => {
  return {
    contents: [
      {
        type: "text",
        uri: "urn:example:welcome-prompt",
        text: "Welcome to the customer service MCP example! This prompt serves as a basic introduction to the capabilities of the MCP server. You can use this prompt to test your tools and see how they interact with the model. Feel free to customize this prompt with additional information or instructions for your specific use case.",
      },
    ],
  };
};