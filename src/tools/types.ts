import { z } from "zod";

export const GreetInput = {
  name: z.string().describe("The name of the person to greet"),
};
