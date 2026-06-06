import type { AiMessage, AiRequest } from "../types/models.js";

export type AiProvider = {
  name: string;
  complete(request: AiRequest): Promise<string>;
  stream(request: AiRequest): AsyncGenerator<string>;
};

export const messagesFromPrompt = (prompt: string): AiMessage[] => [
  {
    role: "system",
    content:
      "You are Aura, a concise personal assistant. Stay grounded in the supplied Aura context. If data is missing, say it is unavailable."
  },
  { role: "user", content: prompt }
];

export async function collectStream(provider: AiProvider, request: AiRequest) {
  const chunks: string[] = [];
  for await (const token of provider.stream(request)) chunks.push(token);
  return chunks.join("");
}
