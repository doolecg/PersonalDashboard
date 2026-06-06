export const messagesFromPrompt = (prompt) => [
    {
        role: "system",
        content: "You are Aura, a concise personal assistant. Stay grounded in the supplied Aura context. If data is missing, say it is unavailable."
    },
    { role: "user", content: prompt }
];
export async function collectStream(provider, request) {
    const chunks = [];
    for await (const token of provider.stream(request))
        chunks.push(token);
    return chunks.join("");
}
