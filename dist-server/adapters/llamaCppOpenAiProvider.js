import { env } from "../env.js";
async function localComplete(request, baseUrl, model) {
    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: request.messages, max_tokens: request.maxTokens ?? 700 })
    });
    if (!response.ok)
        throw new Error(`Local OpenAI-compatible provider failed with ${response.status}`);
    const data = (await response.json());
    return data.choices?.[0]?.message?.content ?? "";
}
export const llamaCppOpenAiProvider = {
    name: "llamacpp",
    complete: (request) => localComplete(request, env.openAiCompatBaseUrl, env.openAiCompatModel),
    async *stream(request) {
        yield await localComplete(request, env.openAiCompatBaseUrl, env.openAiCompatModel);
    }
};
