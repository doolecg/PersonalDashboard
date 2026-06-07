import { env } from "../env.js";
import { logger } from "../logger.js";
import { getAssistantTool, toolSpecsForOpenAi } from "./tools/registry.js";

export type AssistantMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AssistantToolCallLog = {
  name: string;
  arguments: Record<string, unknown>;
};

export type AssistantResult = {
  reply: string;
  toolCalls: AssistantToolCallLog[];
};

type OpenAiToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

type OpenAiMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: OpenAiToolCall[];
  tool_call_id?: string;
};

type OpenAiChatResponse = {
  choices?: Array<{ message: OpenAiMessage; finish_reason?: string }>;
};

const systemPrompt =
  "You are Aura, a helpful personal-dashboard assistant. You can call the provided tools to fetch live information (such as weather) before answering. Be concise and friendly. If a tool returns an error, explain it plainly to the user.";

const maxToolRounds = 4;

async function callOpenAi(messages: OpenAiMessage[]): Promise<OpenAiMessage> {
  if (!env.openAiApiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.aiTimeoutMs);
  try {
    const response = await fetch(`${env.openAiBaseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${env.openAiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: env.openAiModel,
        messages,
        tools: toolSpecsForOpenAi(),
        tool_choice: "auto"
      })
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error("OpenAI authentication failed. Check OPENAI_API_KEY.");
      throw new Error(`OpenAI failed with ${response.status}.`);
    }

    const data = (await response.json()) as OpenAiChatResponse;
    const message = data.choices?.[0]?.message;
    if (!message) throw new Error("OpenAI returned no message.");
    return message;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("OpenAI request timed out.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function parseArgs(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw || "{}");
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function runAssistant(history: AssistantMessage[], contextText?: string): Promise<AssistantResult> {
  const messages: OpenAiMessage[] = [
    { role: "system", content: contextText ? `${systemPrompt}\n\nDashboard context: ${contextText}` : systemPrompt },
    ...history.map((message) => ({ role: message.role, content: message.content }))
  ];

  const toolCalls: AssistantToolCallLog[] = [];

  for (let round = 0; round < maxToolRounds; round += 1) {
    const message = await callOpenAi(messages);
    messages.push(message);

    if (!message.tool_calls?.length) {
      return { reply: message.content?.trim() || "I'm not sure how to answer that.", toolCalls };
    }

    for (const call of message.tool_calls) {
      const tool = getAssistantTool(call.function.name);
      const args = parseArgs(call.function.arguments);
      toolCalls.push({ name: call.function.name, arguments: args });

      let result: unknown;
      try {
        result = tool ? await tool.execute(args) : { error: `Unknown tool: ${call.function.name}` };
      } catch (error) {
        logger.warn("Assistant tool failed", { tool: call.function.name, message: error instanceof Error ? error.message : String(error) });
        result = { error: error instanceof Error ? error.message : "Tool execution failed." };
      }

      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }

  // Ran out of tool rounds — ask the model for a final answer without tools.
  const final = await callOpenAi(messages);
  return { reply: final.content?.trim() || "I wasn't able to complete that request.", toolCalls };
}
