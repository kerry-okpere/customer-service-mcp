// https://github.com/vercel-labs/express-mcp
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { Request, Response } from "express";
import dotenv from "dotenv";
import path from "node:path";
import cors from "cors";
import { methodNotAllowed } from "./utils/index.js";
import { createServer } from "./create-server.js";

// Environment setup
dotenv.config();
const PORT = process.env.PORT || 3000;

// MCP server set up
const { server } = createServer();

// Express app set up
const app = express();
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));
app.use(
  cors({
    origin: true,
    methods: "*",
    allowedHeaders: "Authorization, Origin, Content-Type, Accept, *",
  }),
);
app.options(/.*/, cors());

app.post("/mcp", async (req: Request, res: Response) => {
  console.log(`Received POST request at /mcp with body:`, req.body);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error handling MCP request:", error);

    // Send a JSON-RPC error response
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  } finally {
    try {
      await transport.close();
    } catch (closeErr) {
      console.error("Error closing transport:", closeErr);
    }
  }
});
app.get("/mcp", methodNotAllowed);
app.put("/mcp", methodNotAllowed);
app.delete("/mcp", methodNotAllowed);


// Instantiate and start the server
async function main() {
  try {
    app.listen(PORT, () => {
      console.log(
        `Streamable HTTP Server running on port http://localhost:${PORT}/mcp`,
      );
    });
  } catch (error) {
    console.error("Failed to set up the server:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});


// Handle server shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down server...");
  try {
    await server.close();
    console.log("Server shutdown complete");
  } catch (error) {
    console.error("Error closing server:", error);
  }
  process.exit(0);
});