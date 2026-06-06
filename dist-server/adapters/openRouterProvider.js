import { env } from "../env.js";
const errorMessage = (status) => {
    if (status === 401)
        return "OpenRouter authentication failed. Check OPENROUTER_API_KEY.";
    if (status === 402)
        return "OpenRouter quota or billing is unavailable.";
    if (status === 429)
        return "OpenRouter rate limit reached.";
    if (status >= 500)
        return "OpenRouter is temporarily unavailable.";
    return `OpenRouter failed with ${status}.`;
};
function openRouterBody(request, stream, model) {
    return {
        model,
        messages: request.messages,
        stream,
        max_tokens: request.maxTokens ?? 700,
        provider: env.aiPrivacyMode === "high"
            ? {
                data_collection: "deny"
            }
            : undefined
    };
}
async function requestOpenRouter(request, stream, model) {
    if (!env.openRouterApiKey)
        throw new Error("OPENROUTER_API_KEY is not configured.");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.aiTimeoutMs);
    try {
        const response = await fetch(`${env.openRouterBaseUrl}/chat/completions`, {
            method: "POST",
            signal: controller.signal,
            headers: {
                Authorization: `Bearer ${env.openRouterApiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": env.openRouterSiteUrl,
                "X-OpenRouter-Title": env.openRouterAppName
            },
            body: JSON.stringify(openRouterBody(request, stream, model))
        });
        if (!response.ok)
            throw new Error(errorMessage(response.status));
        return response;
    }
    catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
            throw new Error("OpenRouter request timed out.");
        throw error;
    }
    finally {
        clearTimeout(timeout);
    }
}
async function* parseOpenRouterStream(response) {
    if (!response.body)
        throw new Error("OpenRouter returned an empty stream.");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
        const { value, done } = await reader.read();
        if (done)
            break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const raw of lines) {
            const line = raw.trim();
            if (!line.startsWith("data:"))
                continue;
            const data = line.slice(5).trim();
            if (data === "[DONE]")
                return;
            try {
                const chunk = JSON.parse(data);
                const token = chunk.choices?.[0]?.delta?.content;
                if (token)
                    yield token;
            }
            catch {
                throw new Error("OpenRouter returned a malformed stream chunk.");
            }
        }
    }
}
export function createOpenRouterProvider(model = env.openRouterModel) {
    return {
        name: "openrouter",
        async complete(request) {
            const response = await requestOpenRouter(request, false, model);
            const data = (await response.json());
            return data.choices?.[0]?.message?.content ?? "";
        },
        async *stream(request) {
            const response = await requestOpenRouter(request, true, model);
            yield* parseOpenRouterStream(response);
        }
    };
}
export const openRouterProvider = createOpenRouterProvider();
