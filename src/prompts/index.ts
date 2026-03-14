// ═════════════════════════════════════════════════════════════════════════════
// PROMPTS
// Prompts are reusable conversation starters — they pre-fill the model's
// context so the right tools get called in the right order.
// They return { messages: [{ role: "user", content: { type: "text", text } }] }
// ═════════════════════════════════════════════════════════════════════════════

import { PromptCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AssignAgentPromptInput, DailyBriefingPromptInput, ExplainAssignmentPromptInput } from "./types.js";

// Implement daily_briefing prompt callback

export const getBasicPrompt: PromptCallback = async () => {
  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: "Please analyze the following Python code for potential improvements:\n\n```python\ndef calculate_sum(numbers):\n    total = 0\n    for num in numbers:\n        total = total + num\n    return total\n\nresult = calculate_sum([1, 2, 3, 4, 5])\nprint(result)\n```",
        },
      },
    ],
  };
};

// ─── Prompt 1: assign_best_agent ──────────────────────────────────────────────
// Triggers: get_vip_customers → get_available_agents → assign_agent_to_customer
export const assignBestAgentPrompt: PromptCallback<
  typeof AssignAgentPromptInput
> = ({ top_n }) => ({
  messages: [
    {
      role: "user",
      content: {
        type: "text",
        text: [
          `You are a support operations AI for an ecommerce platform.`,
          ``,
          `Your task:`,
          `1. Call get_vip_customers with top_n=${top_n} to find the highest-spend customers with open tickets.`,
          `2. Call get_available_agents to see who is ready to take a case.`,
          `3. For each VIP customer, call assign_agent_to_customer with their customer_id.`,
          `4. After all assignments, call get_agent_performance_card for the top-rated agent assigned.`,
          ``,
          `For each assignment, explain WHY that agent was the best match — reference their rating,`,
          `specialization, load, and tier clearance. Make the reasoning visible and human.`,
          ``,
          `End with a one-paragraph ops summary: who got assigned to who, and what the team capacity looks like now.`,
        ].join("\n"),
      },
    },
  ],
});

// ─── Prompt 2: daily_briefing ─────────────────────────────────────────────────
// Triggers: get_vip_customers → get_available_agents (read-only, no assignments)
export const dailyBriefingPrompt: PromptCallback<typeof DailyBriefingPromptInput> = () => ({
  messages: [
    {
      role: "user",
      content: {
        type: "text",
        text: [
          `You are a support operations AI. Generate the morning queue briefing.`,
          ``,
          `1. Call get_vip_customers (top_n=2) to see everyone waiting.`,
          `2. Call get_available_agents to see current team capacity.`,
          ``,
          `Structure your briefing as:`,
          ``,
          `## 🔥 VIP Queue`,
          `List each customer: name, tier, spend, issue, and how long they've been waiting.`,
          `Flag anyone waiting over 30 minutes as an SLA risk.`,
          ``,
          `## 👥 Agent Capacity`,
          `List available agents with their ratings and open slots.`,
          `Note anyone on break or at full load.`,
          ``,
          `## ⚠️ Action Items`,
          `Call out the top 1–2 assignments that should happen immediately and why.`,
          ``,
          `Keep the tone like a real ops manager's morning standup — direct and scannable.`,
        ].join("\n"),
      },
    },
  ],
});
// ─── Prompt 3: explain_assignment ─────────────────────────────────────────────
// Designed to work after assign_agent_to_customer has already run.
// Pulls the score breakdown from the assignments log and explains the decision.

export const explainAssignmentPrompt: PromptCallback<
  typeof ExplainAssignmentPromptInput
> = ({ agent_name, customer_name }) => ({
  messages: [
    {
      role: "user",
      content: {
        type: "text",
        text: [
          `Explain why ${agent_name} was assigned to ${customer_name}.`,
          ``,
          `1. Call get_available_agents to retrieve ${agent_name}'s current stats.`,
          `2. Call get_vip_customers to retrieve ${customer_name}'s profile and issue.`,
          `3. Call get_agent_performance_card for ${agent_name} so we can see their full card.`,
          ``,
          `Then walk through the scoring logic:`,
          `- How did their specialization match the customer's issue category?`,
          `- How did their rating compare to other available agents?`,
          `- Was their tier clearance appropriate for this customer?`,
          `- What was their load at the time?`,
          ``,
          `Close with: "Here's why this was the right call" — one clear sentence.`,
        ].join("\n"),
      },
    },
  ],
});
