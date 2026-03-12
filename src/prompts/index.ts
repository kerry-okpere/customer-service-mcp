import {
  PromptCallback,
} from "@modelcontextprotocol/sdk/server/mcp.js";

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