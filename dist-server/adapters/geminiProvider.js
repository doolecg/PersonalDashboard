import { env } from "../env.js";
function geminiRole(role) {
    return role === "assistant" ? "model" : "user";
}
function geminiBody(request) {
    const systemText = request.messages
        .filter((message) => message.role === "system")
        .map((message) => message.content)
        .join("\n");
    return {
        systemInstruction: systemText ? { parts: [{ text: systemText }] } : undefined,
        contents: request.messages
            .filter((message) => message.role !== "system")
            .map((message) => ({ role: geminiRole(message.role), parts: [{ text: message.content }] })),
        generationConfig: {
            maxOutputTokens: request.maxTokens ?? 700
        }
    };
}
const errorMessage = (status) => {
    if (status === 401 || status === 403)
        return "Gemini authentication failed. Check GEMINI_API_KEY.";
    if (status === 429)
        return "Gemini rate limit reached.";
    if (status >= 500)
        return "Gemini is temporarily unavailable.";
    return `Gemini failed with ${status}.`;
};
export function createGeminiProvider(model = env.geminiModel) {
    return {
        name: "gemini",
        async complete(request) {
            if (!env.geminiApiKey)
                throw new Error("GEMINI_API_KEY is not configured.");
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), env.aiTimeoutMs);
            try {
                const response = await fetch(`${env.geminiBaseUrl}/models/${model}:generateContent?key=${env.geminiApiKey}`, {
                    method: "POST",
                    signal: controller.signal,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(geminiBody(request))
                });
                if (!response.ok)
                    throw new Error(errorMessage(response.status));
                const data = (await response.json());
                return data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
            }
            catch (error) {
                if (error instanceof DOMException && error.name === "AbortError")
                    throw new Error("Gemini request timed out.");
                throw error;
            }
            finally {
                clearTimeout(timeout);
            }
        },
        async *stream(request) {
            yield await this.complete(request);
        }
    };
}
export const geminiProvider = createGeminiProvider();
