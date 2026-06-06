import { env } from "../env.js";
import type { AiProvider } from "../providers/aiProvider.js";
import type { AiRequest } from "../types/models.js";

type OpenAiResponsesResult = {
  output_text?: string;
  output?: Array<{
    content?: Array<{ text?: string; type?: string }>;
  }>;
};

const openAiErrorMessage = (status: number) => {
  if (status === 401) return "OpenAI authentication failed. Check OPENAI_API_KEY.";
  if (status === 402) return "OpenAI billing is unavailable.";
  if (status === 429) return "OpenAI rate limit reached.";
  if (status >= 500) return "OpenAI is temporarily unavailable.";
  return `OpenAI failed with ${status}.`;
};

function inputFromRequest(request: AiRequest) {
  return request.messages.map((message) => `${message.role.toUpperCase()}: ${message.content}`).join("\n\n");
}

function responseText(data: OpenAiResponsesResult) {
  if (data.output_text) return data.output_text;
  return data.output?.flatMap((item) => item.content ?? []).map((item) => item.text ?? "").join("") ?? "";
}

async function openAiResponse(request: AiRequest, model: string) {
  if (!env.openAiApiKey) throw new Error("OPENAI_API_KEY is not configured.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.aiTimeoutMs);
  try {
    const response = await fetch(`${env.openAiBaseUrl}/responses`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${env.openAiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        input: inputFromRequest(request),
        max_output_tokens: request.maxTokens ?? 700,
        store: false
      })
    });
    if (!response.ok) throw new Error(openAiErrorMessage(response.status));
    return responseText((await response.json()) as OpenAiResponsesResult);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("OpenAI request timed out.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function createOpenAiProvider(model = env.openAiModel): AiProvider {
  return {
    name: "openai",
    complete: (request) => openAiResponse(request, model),
    async *stream(request) {
      yield await openAiResponse(request, model);
    }
  };
}

export const openAiProvider = createOpenAiProvider();
