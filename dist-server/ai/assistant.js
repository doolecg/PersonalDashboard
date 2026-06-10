import { env } from "../env.js";
import { logger } from "../logger.js";
import { getAiStatus, routeAiComplete } from "../providers/aiRuntime.js";
import { getLocalProvider } from "../serverConfig.js";
import { getAssistantTool, toolSpecsForOpenAi } from "./tools/registry.js";
const systemPrompt = "You are Aura, a helpful personal-dashboard assistant. You can call the provided tools to fetch live information (such as weather) and to manage the user's dashboard: add, complete, or remove to-dos; add, complete, or remove reminders (with optional due dates); add or remove notes; and add, list, or remove calendar events. " +
    "When the user asks you to remind them of something, or to remember something for them, always call BOTH manage_todos (with a short 3-6 word action title) AND manage_notes (with the full context, details, or instructions). " +
    "When the user asks you to schedule or add a calendar event, use manage_calendar. When the user asks you to add or jot something down without specifying, use manage_notes. " +
    "Always confirm the actions you took. Be concise and friendly. If a tool returns an error, explain it plainly. " +
    "Respond in plain conversational text only. Do not use any Markdown formatting: no asterisks for bold or italics, no backticks, no headings, and no bullet or numbered-list markers. " +
    "Never wrap names, places, or values in quotation marks or parentheses — write naturally, like a person talking, so it feels authentic.";
const maxToolRounds = 4;
// Resolve an OpenAI-compatible /chat/completions endpoint for the active routing
// mode so the tool loop works beyond OpenAI: OpenRouter (and `auto`) and a local
// LM Studio / llama.cpp server all speak the same function-calling protocol.
// Returns null when no tool-capable provider is configured (e.g. Gemini-only, or
// no keys), in which case we fall back to a plain routed completion.
function resolveToolEndpoint() {
    const { mode } = getAiStatus();
    const wantOpenAi = mode === "openai" || mode === "auto";
    const wantOpenRouter = mode === "openrouter" || mode === "auto";
    if (wantOpenAi && env.openAiApiKey) {
        return {
            url: `${env.openAiBaseUrl}/chat/completions`,
            headers: { Authorization: `Bearer ${env.openAiApiKey}`, "Content-Type": "application/json" },
            model: env.openAiModel,
            provider: "openai"
        };
    }
    if (wantOpenRouter && env.openRouterApiKey) {
        // Use a dedicated assistant model rather than the free chat rotation — most
        // free models silently ignore the tools parameter and never call functions.
        return {
            url: `${env.openRouterBaseUrl}/chat/completions`,
            headers: {
                Authorization: `Bearer ${env.openRouterApiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": env.openRouterSiteUrl,
                "X-OpenRouter-Title": env.openRouterAppName
            },
            model: env.assistantModel,
            provider: "openrouter"
        };
    }
    // Ollama's native API isn't OpenAI tool-calling compatible, so only LM Studio
    // (the OpenAI-compatible local server) gets the tool loop; Ollama falls back to
    // a plain routed completion.
    if (mode === "local" && getLocalProvider() === "lmstudio") {
        return {
            url: `${env.openAiCompatBaseUrl}/chat/completions`,
            headers: { "Content-Type": "application/json" },
            model: env.openAiCompatModel,
            provider: "openai-compatible"
        };
    }
    return null;
}
async function callChatCompletions(endpoint, messages) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.aiTimeoutMs);
    try {
        const response = await fetch(endpoint.url, {
            method: "POST",
            signal: controller.signal,
            headers: endpoint.headers,
            body: JSON.stringify({
                model: endpoint.model,
                messages,
                tools: toolSpecsForOpenAi(),
                tool_choice: "auto"
            })
        });
        if (!response.ok) {
            if (response.status === 401)
                throw new Error(`${endpoint.provider} authentication failed.`);
            throw new Error(`${endpoint.provider} failed with ${response.status}.`);
        }
        const data = (await response.json());
        const message = data.choices?.[0]?.message;
        if (!message)
            throw new Error(`${endpoint.provider} returned no message.`);
        return message;
    }
    catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
            throw new Error(`${endpoint.provider} request timed out.`);
        throw error;
    }
    finally {
        clearTimeout(timeout);
    }
}
function parseArgs(raw) {
    try {
        const parsed = JSON.parse(raw || "{}");
        return typeof parsed === "object" && parsed !== null ? parsed : {};
    }
    catch {
        return {};
    }
}
// Run the function-calling tool loop against whatever OpenAI-compatible provider
// is active; if none is tool-capable (or the loop fails — e.g. a free model that
// rejects the tools param), fall back to a plain routed completion so chat still
// works, just without the ability to act on the dashboard.
export async function runAssistant(history, contextText, userId = "local") {
    const endpoint = resolveToolEndpoint();
    if (endpoint) {
        try {
            return await runWithToolLoop(endpoint, history, contextText, userId);
        }
        catch (error) {
            logger.warn("Assistant tool loop failed; falling back to routed completion", {
                provider: endpoint.provider,
                message: error instanceof Error ? error.message : String(error)
            });
        }
    }
    const systemContent = contextText ? `${systemPrompt}\n\nDashboard context: ${contextText}` : systemPrompt;
    const result = await routeAiComplete({
        messages: [{ role: "system", content: systemContent }, ...history],
        maxTokens: 700
    });
    return { reply: result.message.trim() || "I'm not sure how to answer that.", toolCalls: [] };
}
async function runWithToolLoop(endpoint, history, contextText, userId) {
    const messages = [
        { role: "system", content: contextText ? `${systemPrompt}\n\nDashboard context: ${contextText}` : systemPrompt },
        ...history.map((message) => ({ role: message.role, content: message.content }))
    ];
    const toolCalls = [];
    for (let round = 0; round < maxToolRounds; round += 1) {
        const message = await callChatCompletions(endpoint, messages);
        messages.push(message);
        if (!message.tool_calls?.length) {
            return { reply: message.content?.trim() || "I'm not sure how to answer that.", toolCalls };
        }
        for (const call of message.tool_calls) {
            const tool = getAssistantTool(call.function.name);
            const args = parseArgs(call.function.arguments);
            toolCalls.push({ name: call.function.name, arguments: args });
            let result;
            try {
                result = tool ? await tool.execute(args, { userId }) : { error: `Unknown tool: ${call.function.name}` };
            }
            catch (error) {
                logger.warn("Assistant tool failed", { tool: call.function.name, message: error instanceof Error ? error.message : String(error) });
                result = { error: error instanceof Error ? error.message : "Tool execution failed." };
            }
            messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
        }
    }
    // Ran out of tool rounds — ask the model for a final answer without tools.
    const final = await callChatCompletions(endpoint, messages);
    return { reply: final.content?.trim() || "I wasn't able to complete that request.", toolCalls };
}
