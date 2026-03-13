import { z } from "zod";

export const AssignAgentPromptInput = {
  top_n: z.string().default("3").describe("How many VIP customers to process"),
};

export const ExplainAssignmentPromptInput = {
  agent_name: z.string().describe("The name of the assigned agent"),
  customer_name: z.string().describe("The name of the customer"),
};

export const DailyBriefingPromptInput = {};