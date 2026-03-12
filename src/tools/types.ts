import { z } from "zod";

export const GreetInput = {
  name: z.string().length(2).describe("The name of the person to greet"),
};
