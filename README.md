# customer-service-mcp

A Model Context Protocol (MCP) server that exposes tools for AI assistants (e.g. VS Code Copilot, Claude Desktop). Built with Node.js + Express.

> This repository is for the MCP workshop at AI-Assisted Codable meetup March 2026.  
> To see the final MCP solution check out the [feat/final](https://github.com/kerry-okpere/customer-service-mcp/tree/feat/final) branch.

---

## Prerequisites

**1. Install Node.js** (pick one)

- **Homebrew (macOS):** `brew install node`
- **Official installer:** [nodejs.org](https://nodejs.org) → LTS → run installer

**Verify:**

```bash
node -v   # v18 or higher
npm -v
```

---

## Setup

```bash
# Clone the repo
git clone git@github.com:kerry-okpere/customer-service-mcp.git
cd customer-service-mcp

# Install dependencies
npm install
```

> Optionally checkout the final branch to see the completed solution: `git checkout feat/final`

---

## Connect to Claude Desktop (STDIO)

> Run this **or** the VS Code option — not both at the same time.

**1. Build the project**

```bash
npm run build
```

**2. Open your Claude Desktop config file**

In the Claude menu bar go to **Settings → Developer tab → Edit Config** — this opens the config file in your file explorer:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

**3. Open the config file and add the server config**

Replace `{username}` and `{project-folder}` with your actual path:

```json
{
  "mcpServers": {
    "customer-service": {
      "command": "node",
      "args": ["/Users/{username}/{project-folder}/build/stdio.js"]
    }
  }
}
```

> **NVM users:** Claude Desktop may pick up an old Node version from your PATH. If the server fails to connect, use the absolute path to Node 18+ instead:
> Run `which node` in your terminal (with the correct NVM version active) to get the exact path.
> ```
> "command": "/Users/{username}/.nvm/versions/node/{version}/bin/node"
> ```


**4. Restart Claude Desktop** — the tools will appear automatically.

---

## Connect to VS Code (HTTP)

> Run this **or** the Claude Desktop option — not both at the same time.

**1. Start the server**

```bash
npm run dev
```

Server runs at `http://localhost:3000/mcp`.

**2. Add to `.vscode/mcp.json`**

```json
{
  "servers": {
    "customer-service": {
      "url": "http://localhost:3000/mcp",
      "type": "http"
    }
  }
}
```

Open **Copilot Chat** in VS Code — the tools will appear automatically.

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
