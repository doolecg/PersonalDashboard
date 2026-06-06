import { env } from "../env.js";
import type { AiProvider } from "../providers/aiProvider.js";
import type { AiRequest } from "../types/models.js";

async function ollamaChat(request: AiRequest) {
  const response = await fetch(`${env.ollamaBaseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: env.ollamaModel, messages: request.messages, stream: false })
  });
  if (!response.ok) throw new Error(`Ollama failed with ${response.status}`);
  const data = (await response.json()) as { message?: { content?: string } };
  return data.message?.content ?? "";
}

export const ollamaProvider: AiProvider = {
  name: "ollama",
  complete: ollamaChat,
  async *stream(request) {
    yield await ollamaChat(request);
  }
};
