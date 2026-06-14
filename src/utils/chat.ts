import type { ChatMessage, Recipe } from "../types";

export const ANTHROPIC_API_KEY_STORAGE = "grocery-app:anthropic-api-key";
const CHAT_MODEL = "claude-haiku-4-5-20251001";

export function buildRecipeSystemPrompt(recipe: Recipe): string {
  const ingredients = recipe.ingredients.length
    ? recipe.ingredients.map((i) => `- ${i}`).join("\n")
    : "(none listed)";
  const instructions = recipe.instructions.length
    ? recipe.instructions.map((step, i) => `${i + 1}. ${step}`).join("\n")
    : "(none listed)";

  return [
    `You are a friendly, concise cooking assistant helping someone cook "${recipe.name}" right now.`,
    "Keep replies short and conversational, since the user is likely hands-on and may be listening via voice.",
    "",
    "Ingredients:",
    ingredients,
    "",
    "Instructions:",
    instructions,
    "",
    "Use the ingredients and instructions above to answer questions about steps, quantities, substitutions, and timing. When the user mentions something they just did (e.g. 'I added the butter'), tell them what to do next based on the instructions.",
  ].join("\n");
}

export async function sendChatMessage(
  apiKey: string,
  system: string,
  messages: ChatMessage[],
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      max_tokens: 1024,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const data = await res.json();
      detail = typeof data?.error?.message === "string" ? data.error.message : "";
    } catch {
      // ignore - use generic message below
    }
    throw new Error(detail || `Request failed (${res.status})`);
  }

  const data = await res.json();
  const block = Array.isArray(data.content)
    ? data.content.find((b: { type: string }) => b.type === "text")
    : null;
  return typeof block?.text === "string" ? block.text : "";
}
