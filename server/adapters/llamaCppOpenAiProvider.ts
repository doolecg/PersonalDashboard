import { env } from "../env.js";
import type { AiProvider } from "../providers/aiProvider.js";
import type { AiRequest } from "../types/models.js";

async function localComplete(request: AiRequest, baseUrl: string, model: string) {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: request.messages, max_tokens: request.maxTokens ?? 700 })
  });
  if (!response.ok) throw new Error(`Local OpenAI-compatible provider failed with ${response.status}`);
  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
}

export const llamaCppOpenAiProvider: AiProvider = {
  name: "llamacpp",
  complete: (request) => localComplete(request, env.openAiCompatBaseUrl, env.openAiCompatModel),
  async *stream(request) {
    yield await localComplete(request, env.openAiCompatBaseUrl, env.openAiCompatModel);
  }
};
