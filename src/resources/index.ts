import { ReadResourceCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getAgentRoster } from "../lambdas.js";

// ═════════════════════════════════════════════════════════════════════════════
// RESOURCE
// Resources provide ambient context the model can read at any time.
// They return a single { uri, mimeType, text } — not a list of content blocks.
// Think of them as "documents" the model can reference.
// ═════════════════════════════════════════════════════════════════════════════

// Implement support://agents/roster resource callback
export const agentRoster: ReadResourceCallback = async () => {
  const roster = getAgentRoster();

  // ── Resource response: uri + mimeType + text ──
  // The text is designed to be embedded directly into a prompt as context.
  return {
    contents: [
      {
        uri: roster.uri,
        mimeType: "text/plain",
        text: [
          `LIVE AGENT ROSTER`,
          `Generated : ${roster.generated_at}`,
          `Total     : ${roster.total_agents} agents  |  Available: ${roster.available_count}`,
          ``,
          roster.text,
        ].join("\n"),
      },
    ],
  };
};
