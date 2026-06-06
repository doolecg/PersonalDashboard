export function buildMorningBriefingPrompt(context) {
    return [
        "Generate 3 concise dashboard briefing bullets.",
        "Mention only supplied data. Do not invent private data.",
        `Context: ${JSON.stringify(context)}`
    ].join("\n");
}
export function buildMessageSummaryPrompt(context) {
    return [
        "Summarize unread messages in one dashboard-friendly sentence.",
        "Use previews only. If none are available, say there are no unread messages.",
        `Context: ${JSON.stringify({ messages: context.messages ?? [] })}`
    ].join("\n");
}
