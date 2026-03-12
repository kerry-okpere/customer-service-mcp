// smartroute-functions.js
// Core logic for SmartRoute MCP — keep this framework-agnostic so it
// can be wired into any MCP transport (stdio, SSE, etc.)

import { readFileSync, writeFileSync } from "fs";
import { createCanvas } from "canvas";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { Customer, Customers } from "./model/customers/type.js";
import { Agent, Agents } from "./model/agents/type.js";
import { Assignment, Assignments } from "./model/assignments/type.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "src", "model");

// ─── Data helpers ────────────────────────────────────────────────────────────

function dataIndexPath(name: string) {
return join(dataDir, name, "index.json");
}

function loadJSON(foldername: string) {
  return JSON.parse(readFileSync(dataIndexPath(foldername), "utf-8"));
}

function saveJSON(foldername: string, data: any) {
  writeFileSync(dataIndexPath(foldername), JSON.stringify(data, null, 2));
}

// ─── Tool: get_vip_customers ─────────────────────────────────────────────────
// Returns top N customers sorted by total_spend who have open tickets.

export function getVipCustomers({ top_n = 3 } = {}) {
  const { customers } = loadJSON("customers") as Customers;

  const vips = customers
    .filter((c) => c.open_tickets > 0)
    .sort((a, b) => b.total_spend - a.total_spend)
    .slice(0, top_n);

  return {
    count: vips.length,
    retrieved_at: new Date().toISOString(),
    customers: vips.map((c) => ({
      id: c.id,
      name: c.name,
      tier: c.tier,
      total_spend: c.total_spend,
      open_tickets: c.open_tickets,
      latest_issue: c.latest_issue,
      issue_category: c.issue_category,
      waiting_since_minutes: c.waiting_since_minutes,
      avatar_initials: c.avatar_initials,
      avatar_color: c.avatar_color,
    })),
  };
}

// ─── Tool: get_available_agents ──────────────────────────────────────────────
// Returns agents whose status is "available" and who have capacity remaining.

export function getAvailableAgents() {
  const { agents } = loadJSON("agents") as Agents;

  const available = agents
    .filter((a) => a.status === "available" && a.current_load < a.max_load)
    .sort((a, b) => b.rating - a.rating);

  return {
    count: available.length,
    retrieved_at: new Date().toISOString(),
    agents: available.map((a) => ({
      id: a.id,
      name: a.name,
      status: a.status,
      rating: a.rating,
      specializations: a.specializations,
      current_load: a.current_load,
      max_load: a.max_load,
      slots_remaining: a.max_load - a.current_load,
      resolution_rate: a.resolution_rate,
      avg_handle_time_minutes: a.avg_handle_time_minutes,
      tier_clearance: a.tier_clearance,
      badge: a.badge,
      avatar_initials: a.avatar_initials,
      avatar_color: a.avatar_color,
    })),
  };
}

// ─── Scoring logic (used internally + exposed for explain_assignment) ─────────

export function scoreAgent(agent: Agent, customer: Customer) {
  // 1. Rating score  (0–50)
  const ratingScore = Math.round(agent.rating * 10);

  // 2. Specialization match (0–30)
  const specializationScore = agent.specializations.includes(
    customer.issue_category,
  )
    ? 30
    : 0;

  // 3. Availability / headroom score (0–20)
  const headroom = agent.max_load - agent.current_load;
  const availabilityScore = Math.round((headroom / agent.max_load) * 20);

  // 4. Tier clearance match (0–10)
  const tierOrder = { Silver: 1, Gold: 2, Platinum: 3 };
  const agentTierValue = tierOrder[agent.tier_clearance] ?? 0;
  const customerTierValue = tierOrder[customer.tier] ?? 0;
  const tierScore = agentTierValue >= customerTierValue ? 10 : 0;

  const total =
    ratingScore + specializationScore + availabilityScore + tierScore;

  return {
    agent_id: agent.id,
    agent_name: agent.name,
    score_breakdown: {
      specialization_match_score: specializationScore,
      availability_score: availabilityScore,
      tier_clearance_score: tierScore,
      agent_rating_score: ratingScore,
      total,
    },
  };
}

// ─── Tool: assign_agent_to_customer ──────────────────────────────────────────
// Scores all available agents for a given customer and assigns the best match.
// Mutates agents/index.json (load++) and appends to assignments/index.json.

export function assignAgentToCustomer({ customer_id }: { customer_id: string }) {
  const { customers } = loadJSON("customers") as Customers;
  const agentsData = loadJSON("agents") as Agents;
  const assignmentsData = loadJSON("assignments") as Assignments;

  const customer = customers.find((c) => c.id === customer_id);
  if (!customer) throw new Error(`Customer ${customer_id} not found`);

  const available = agentsData.agents.filter(
    (a) => a.status === "available" && a.current_load < a.max_load,
  );
  if (available.length === 0) throw new Error("No agents currently available");

  // Score every available agent and pick the winner
  const scored = available
    .map((agent) => ({ agent, ...scoreAgent(agent, customer) }))
    .sort((a, b) => b.score_breakdown.total - a.score_breakdown.total);

  const winner = scored[0];
  const winnerAgent = winner.agent;

  // Build human-readable reason
  const reasons = [];
  if (winner.score_breakdown.specialization_match_score > 0)
    reasons.push(`specializes in ${customer.issue_category}`);
  if (winner.score_breakdown.tier_clearance_score > 0)
    reasons.push(`cleared for ${customer.tier} customers`);
  reasons.push(
    `rated ${winnerAgent.rating}/5 with ${winnerAgent.resolution_rate}% resolution rate`,
  );
  reasons.push(
    `${winnerAgent.max_load - winnerAgent.current_load} slot(s) available`,
  );

  const reason = `${winnerAgent.name} selected — ${reasons.join(", ")}.`;

  // Persist: bump agent load
  const agentIdx = agentsData.agents.findIndex((a) => a.id === winnerAgent.id);
  agentsData.agents[agentIdx].current_load += 1;
  agentsData.agents[agentIdx].active_cases.push(customer_id);
  saveJSON("agents", agentsData);

  // Persist: log the assignment
  const newAssignment: Assignment = {
    id: `assign_${String(assignmentsData.assignments.length + 1).padStart(3, "0")}`,
    customer_id,
    agent_id: winnerAgent.id,
    assigned_at: new Date().toISOString(),
    reason,
    score_breakdown: winner.score_breakdown,
    // all_scores: scored.map((s) => ({
    //   agent_id: s.agent_id,
    //   agent_name: s.agent_name,
    //   total: s.score_breakdown.total,
    // })),
    status: "active",
    resolved_at: null,
  };
  assignmentsData.assignments.push(newAssignment);
  saveJSON("assignments", assignmentsData);

  return {
    assignment_id: newAssignment.id,
    customer: {
      id: customer.id,
      name: customer.name,
      tier: customer.tier,
      total_spend: customer.total_spend,
      issue: customer.latest_issue,
    },
    assigned_agent: {
      id: winnerAgent.id,
      name: winnerAgent.name,
      rating: winnerAgent.rating,
      specializations: winnerAgent.specializations,
      badge: winnerAgent.badge,
      avatar_initials: winnerAgent.avatar_initials,
      avatar_color: winnerAgent.avatar_color,
    },
    reason,
    score_breakdown: winner.score_breakdown,
    runner_up: scored[1]
      ? {
          agent_name: scored[1].agent_name,
          total_score: scored[1].score_breakdown.total,
        }
      : null,
    assigned_at: newAssignment.assigned_at,
  };
}

// ─── Tool: get_agent_performance_card ────────────────────────────────────────
// Renders a PNG performance card for an agent and returns it as base64.

export async function getAgentPerformanceCard({ agent_id } : { agent_id: string }) {
  const { agents } = loadJSON("agents") as Agents;
  const agent = agents.find((a) => a.id === agent_id);
  if (!agent) throw new Error(`Agent ${agent_id} not found`);

  const W = 520;
  const H = 300;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#0F172A";
  ctx.roundRect(0, 0, W, H, 16);
  ctx.fill();

  // Accent stripe
  ctx.fillStyle = agent.avatar_color;
  ctx.fillRect(0, 0, 6, H);

  // Avatar circle
  const avatarX = 52;
  const avatarY = 70;
  ctx.fillStyle = agent.avatar_color + "33"; // 20% opacity
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = agent.avatar_color;
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, 28, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 15px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(agent.avatar_initials, avatarX, avatarY + 5);

  // Name + badge
  ctx.textAlign = "left";
  ctx.fillStyle = "#F8FAFC";
  ctx.font = "bold 22px sans-serif";
  ctx.fillText(agent.name, 100, 60);

  if (agent.badge) {
    const badgeX = 100;
    const badgeY = 72;
    const badgeText = `  ${agent.badge}  `;
    ctx.font = "11px sans-serif";
    const bW = ctx.measureText(badgeText).width + 6;
    ctx.fillStyle = agent.avatar_color;
    ctx.roundRect(badgeX, badgeY, bW, 20, 4);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(badgeText, badgeX + 3, badgeY + 14);
  }

  ctx.fillStyle = "#94A3B8";
  ctx.font = "13px sans-serif";
  ctx.fillText(
    `${agent.specializations.join(" · ")}`,
    100,
    badge_offset(agent),
  );

  // ── Stats row ──
  const stats = [
    { label: "Rating", value: `${agent.rating}`, unit: "/ 5.0" },
    { label: "Resolution", value: `${agent.resolution_rate}%`, unit: "" },
    {
      label: "Avg Handle",
      value: `${agent.avg_handle_time_minutes}`,
      unit: "min",
    },
    { label: "Today", value: `${agent.cases_resolved_today}`, unit: "cases" },
  ];

  const statStartY = 150;
  const colW = W / stats.length;

  stats.forEach((stat, i) => {
    const cx = i * colW + colW / 2;

    // Divider
    if (i > 0) {
      ctx.strokeStyle = "#1E293B";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(i * colW, statStartY - 10);
      ctx.lineTo(i * colW, statStartY + 70);
      ctx.stroke();
    }

    ctx.fillStyle = "#F8FAFC";
    ctx.font = "bold 28px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(stat.value, cx, statStartY + 32);

    ctx.fillStyle = agent.avatar_color;
    ctx.font = "11px sans-serif";
    ctx.fillText(stat.unit, cx, statStartY + 48);

    ctx.fillStyle = "#64748B";
    ctx.font = "11px sans-serif";
    ctx.fillText(stat.label.toUpperCase(), cx, statStartY + 65);
  });

  // ── Load bar ──
  const barY = 240;
  ctx.fillStyle = "#1E293B";
  ctx.roundRect(30, barY, W - 60, 12, 6);
  ctx.fill();

  const loadPct = agent.current_load / agent.max_load;
  const barColor =
    loadPct >= 1 ? "#EF4444" : loadPct >= 0.75 ? "#F59E0B" : "#22C55E";
  ctx.fillStyle = barColor;
  ctx.roundRect(30, barY, (W - 60) * loadPct, 12, 6);
  ctx.fill();

  ctx.fillStyle = "#94A3B8";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(
    `Load: ${agent.current_load} / ${agent.max_load} active cases`,
    30,
    barY + 26,
  );

  ctx.textAlign = "right";
  ctx.fillStyle =
    agent.status === "available"
      ? "#22C55E"
      : agent.status === "on_break"
        ? "#F59E0B"
        : "#EF4444";
  ctx.fillText(agent.status.replace("_", " ").toUpperCase(), W - 30, barY + 26);

  // Footer
  ctx.fillStyle = "#334155";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    `SmartRoute · ${agent.years_experience}yr exp · ${new Date().toLocaleDateString()}`,
    W / 2,
    H - 12,
  );

  const base64 = canvas.toBuffer("image/png").toString("base64");

  return {
    agent_id: agent.id,
    agent_name: agent.name,
    image_data: base64,
    image_mime_type: "image/png",
    summary: {
      rating: agent.rating,
      resolution_rate: agent.resolution_rate,
      avg_handle_time_minutes: agent.avg_handle_time_minutes,
      cases_today: agent.cases_resolved_today,
      status: agent.status,
      load: `${agent.current_load}/${agent.max_load}`,
    },
  };
}

// helper: push specialization line down if badge is present
function badge_offset(agent: Agent) {
  return agent.badge ? 112 : 95;
}

// ─── Resource: support://agents/roster ───────────────────────────────────────
// Returns the full roster as structured text + data — designed to be
// embedded as context for prompts.

export function getAgentRoster() {
  const { agents } = loadJSON("agents") as Agents;

  const lines = agents.map((a) => {
    const load = `${a.current_load}/${a.max_load}`;
    const slots = a.max_load - a.current_load;
    return [
      `• ${a.name} (${a.id})`,
      `  Status     : ${a.status}`,
      `  Rating     : ${a.rating}/5  |  Resolution: ${a.resolution_rate}%  |  Avg handle: ${a.avg_handle_time_minutes}min`,
      `  Specializes: ${a.specializations.join(", ")}`,
      `  Load       : ${load}  (${slots} slot${slots !== 1 ? "s" : ""} free)`,
      `  Tier access: ${a.tier_clearance}`,
      a.badge ? `  Badge      : ${a.badge}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  });

  return {
    uri: "support://agents/roster",
    title: "Live Agent Roster",
    generated_at: new Date().toISOString(),
    total_agents: agents.length,
    available_count: agents.filter(
      (a) => a.status === "available" && a.current_load < a.max_load,
    ).length,
    text: lines.join("\n\n"),
    agents,
  };
}
