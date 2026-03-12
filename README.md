# customer-service-mcp

A Model Context Protocol (MCP) server that exposes tools for AI assistants (e.g. VS Code Copilot, Claude Desktop). Built with Node.js + Express.

>This repository is for the MCP workshop at AI-Assisted codable meetup March 2026.
TO see the final MCP solution check out the [feat/Final](https://github.com/kerry-okpere/customer-service-mcp/tree/feat/final) branch

---

## Prerequisites

You need **Node.js** installed. That's it.

### Install Node.js (pick one)

**Option A — Homebrew (macOS, recommended)**
```bash
brew install node
```

**Option B — Official installer**  
Download from [nodejs.org](https://nodejs.org) → pick the **LTS** version → run the installer.

**Verify it worked:**
```bash
node -v   # should print v18 or higher
npm -v    # should print a version number
```

---

## Setup

```bash
# 1. Clone the starter branch 
git clone git@github.com:kerry-okpere/customer-service-mcp.git
cd customer-service-mcp

# 2. Install dependencies
npm install

# 3. Optionally Checkout to the final branch to view all changes
git checkout feat/final
```

---

## Run In Dev mode 
```bash
npm run dev
```

The server runs at `http://localhost:3000/mcp`.

---

## Connect to VS Code

Add this to your VS Code `.vscode/mcp.json`:

```json
{
  "servers": {
    "customer-service-mcp": {
      "url": "http://localhost:3000/mcp",
      "type": "http"
    }
  }
}
```

Then open the **Copilot Chat** panel in VS Code → the tools will appear automatically.

---

## Project structure

```
src/
  index.ts          # Express server + MCP transport (entry point)
  create-server.ts  # Registers all MCP tools
  tools/
    index.ts        # Tool handler implementations
    types.ts        # Zod input schemas for each tool
  utils/
    index.ts        # Shared Express helpers
```
