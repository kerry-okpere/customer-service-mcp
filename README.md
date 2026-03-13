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

---

## Test greet tool with prompt
using the greeting tool to answer this request.

Call the greeting tool with the name "Kerry" and return its response exactly as provided by the tool.

Do not generate your own greeting. Only use the greeting tool.


## 🔧 Tools
`get_available_agents` — no arguments, good first test
```
Who are the available support agents right now? List their ratings, specializations, and how many slots they have open.
```
`get_vip_customers` — tests argument passing
```
Show me the top 3 VIP customers who currently have open support tickets, ranked by their lifetime spend.
```
`assign_agent_to_customer` — the stateful tool, run after the two above
```
Assign the best available agent to customer cust_001. Show me the score breakdown and explain why that agent was chosen over the others.
```
`get_agent_performance_card` — the image moment, run this last

`Show me the performance card for agent_001.`

## 📖 Resource
`support://agents/roster` — tests that the model reads context before acting

```
Before recommending any assignments, read the agent roster first. Then tell me which agents are at risk of being overloaded and which ones have the most capacity right now.
```

## 💬 Prompts
`daily_briefing` — no arguments
```
Run the daily briefing.
```
`assign_best_agent` — with argument
```
Run assign_best_agent for the top 3 VIP customers.
```
`explain_assignment` — run this after assign_agent_to_customer has fired
```
Run explain_assignment for agent Sarah Chen and customer Priya Kapoor.
```

## 🎯 Demo Sequence (paste these in order)
If you want one clean run that hits every primitive in the right order for an audience:
1. Run the daily briefing.
2. Show me the top 3 VIP customers with open tickets.
3. Assign the best available agent to cust_001, then to cust_002.
4. Show me the performance card for whoever was assigned to Priya Kapoor.
5. Now explain why that agent was chosen over the others.
