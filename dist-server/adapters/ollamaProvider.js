import { env } from "../env.js";
async function ollamaChat(request) {
    const response = await fetch(`${env.ollamaBaseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: env.ollamaModel, messages: request.messages, stream: false })
    });
    if (!response.ok)
        throw new Error(`Ollama failed with ${response.status}`);
    const data = (await response.json());
    return data.message?.content ?? "";
}
export const ollamaProvider = {
    name: "ollama",
    complete: ollamaChat,
    async *stream(request) {
        yield await ollamaChat(request);
    }
};
