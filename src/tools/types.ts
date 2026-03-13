import { z } from "zod";

export const GreetInput = {
  name: z.string().describe("The name of the person to greet"),
};

export const VipCustomersInput = {
  top_n: z
    .number()
    .min(1)
    .max(10)
    .default(3)
    .describe("How many top customers to return"),
};

export const AssignAgentInput = {
  customer_id: z
    .string()
    .describe("The customer ID to assign an agent to, e.g. cust_001"),
};

export const GetAgentPerformanceCardInput = {
  agent_id: z
    .string()
    .describe("The agent ID to generate a performance card for, e.g. agent_123"),
};