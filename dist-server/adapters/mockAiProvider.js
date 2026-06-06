const mockResponse = (prompt) => {
    const lower = prompt.toLowerCase();
    if (lower.includes("message"))
        return "Three unread threads need attention. Morgan and Alex look most reply-worthy.";
    if (lower.includes("weather"))
        return "Weather is cloudy with rain risk later. Check the hourly strip before heading out.";
    if (lower.includes("brief") || lower.includes("today"))
        return "Weather, messages, calendar, reminders, and notes are available. Start with reply-worthy messages and today's scheduled blocks.";
    return "I can help with today's messages, reminders, calendar, weather, notes, and priorities.";
};
export const mockAiProvider = {
    name: "mock",
    async complete(request) {
        return mockResponse(request.messages.at(-1)?.content ?? "");
    },
    async *stream(request) {
        const text = mockResponse(request.messages.at(-1)?.content ?? "");
        for (const token of text.split(/(\s+)/)) {
            if (!token)
                continue;
            await new Promise((resolve) => setTimeout(resolve, 18));
            yield token;
        }
    }
};
