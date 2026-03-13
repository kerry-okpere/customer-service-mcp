import { ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AssignAgentInput, GetAgentPerformanceCardInput, GreetInput, VipCustomersInput } from "./types.js";
import {
  assignAgentToCustomer,
  getAgentPerformanceCard,
  getAvailableAgents,
  getVipCustomers,
} from "../lambdas.js";
// ═════════════════════════════════════════════════════════════════════════════
// TOOLS
// Each tool handler:
//   1. Calls the matching smartroute function
//   2. Formats the JS object result into MCP content blocks
//   3. Returns { content: [...blocks] }
// ═════════════════════════════════════════════════════════════════════════════

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

// ─── Tool 1: get_vip_customers ────────────────────────────────────────────────
// Returns a text block summarising VIP customers + a JSON block with full data.
// Why two blocks? The text block is human-readable for the model; the JSON block
// lets the model (or client) parse structured data if needed.
export const vipCustomers: ToolCallback<typeof VipCustomersInput> = async ({
  top_n,
}) => {
  /*2 */ const result = getVipCustomers({ top_n });

  // ── Shape into a readable summary ──
  /*4 */ const lines = result.customers.map((c, i) =>
    [
      `${i + 1}. ${c.name} (${c.tier}) — $${c.total_spend.toLocaleString()} lifetime spend`,
      `   Issue     : ${c.latest_issue}`,
      `   Category  : ${c.issue_category}`,
      `   Waiting   : ${c.waiting_since_minutes} minutes`,
      `   Open tickets: ${c.open_tickets}`,
    ].join("\n"),
  );

  /*5 */ const summary =
    `VIP Customers with Open Tickets (top ${result.count})\n` +
    `Retrieved: ${result.retrieved_at}\n\n` +
    lines.join("\n\n");

  // ── Return: one text block (readable) + one JSON block (structured) ──
  /*3 */ return {
    content: [
      {
        type: "text",
        text: summary,
      },
      {
        type: "text",
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
};

// ─── Tool 2: get_available_agents ─────────────────────────────────────────────
// Returns a text summary of agents who are available and have capacity.
export const availableAgents: ToolCallback<{}> = async () => {
  const result = getAvailableAgents();

  const lines = result.agents.map((a) =>
    [
      `• ${a.name}${a.badge ? ` [${a.badge}]` : ""}`,
      `  Rating       : ${a.rating}/5.0  |  Resolution: ${a.resolution_rate}%  |  Avg handle: ${a.avg_handle_time_minutes}min`,
      `  Specializes  : ${a.specializations.join(", ")}`,
      `  Load         : ${a.current_load}/${a.max_load}  (${a.slots_remaining} slot${a.slots_remaining !== 1 ? "s" : ""} free)`,
      `  Tier access  : ${a.tier_clearance}`,
    ].join("\n"),
  );

  const summary =
    `Available Agents — ${result.count} ready\n` +
    `Retrieved: ${result.retrieved_at}\n\n` +
    lines.join("\n\n");

  return {
    content: [
      {
        type: "text",
        text: summary,
      },
      {
        type: "text",
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
};

// ─── Tool 3: assign_agent_to_customer ─────────────────────────────────────────
// The centrepiece tool. Returns a rich confirmation:
//   - text block with the assignment decision + reasoning
//   - text block with the full score breakdown (JSON)
// The image card is separate (call get_agent_performance_card for that).
export const assignAgent: ToolCallback<typeof AssignAgentInput> = async ({
  customer_id,
}) => {
  const result = assignAgentToCustomer({ customer_id });

  const scoreLines = Object.entries(result.score_breakdown)
    .filter(([key]) => key !== "total")
    .map(([key, val]) => `  ${key.padEnd(30)}: ${val} pts`);

  const confirmation = [
    `✅ Assignment Confirmed`,
    ``,
    `Customer  : ${result.customer.name} (${result.customer.tier}) — $${result.customer.total_spend.toLocaleString()} spend`,
    `Issue     : ${result.customer.issue}`,
    ``,
    `Assigned  : ${result.assigned_agent.name}${result.assigned_agent.badge ? ` [${result.assigned_agent.badge}]` : ""}`,
    `Rating    : ${result.assigned_agent.rating}/5.0`,
    ``,
    `Reason    : ${result.reason}`,
    ``,
    `Score Breakdown`,
    `─────────────────────────────────────`,
    ...scoreLines,
    `  ${"TOTAL".padEnd(30)}: ${result.score_breakdown.total} pts`,
    ``,
    result.runner_up
      ? `Runner-up : ${result.runner_up.agent_name} (${result.runner_up.total_score} pts)`
      : `Runner-up : none`,
    ``,
    `Assignment ID : ${result.assignment_id}`,
    `Assigned at   : ${result.assigned_at}`,
  ].join("\n");

  return {
    content: [
      {
        type: "text",
        text: confirmation,
      },
      {
        type: "text",
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
};

// ─── Tool 4: get_agent_performance_card ───────────────────────────────────────
// The multimedia moment. Returns an IMAGE content block (base64 PNG) so the
// MCP client renders an actual card — not JSON, not text — a visual.
export const getAgentPerformanceCardTool: ToolCallback<
  typeof GetAgentPerformanceCardInput
> = async ({ agent_id }) => {
  const result = await getAgentPerformanceCard({ agent_id });

  return {
    content: [
      // ── This is the MCP image content block ──
      // The client receives base64 PNG and renders it inline.
      // This is what makes MCP different from a REST endpoint returning JSON.
      {
        type: "image",
        data: result.image_data,
        mimeType: result.image_mime_type,
      },
      // ── Text summary alongside the image ──
      {
        type: "text",
        text: [
          `Performance Card — ${result.agent_name}`,
          `Rating       : ${result.summary.rating}/5.0`,
          `Resolution   : ${result.summary.resolution_rate}%`,
          `Avg handle   : ${result.summary.avg_handle_time_minutes} min`,
          `Cases today  : ${result.summary.cases_today}`,
          `Status       : ${result.summary.status}`,
          `Load         : ${result.summary.load}`,
        ].join("\n"),
      },
    ],
  };
};
