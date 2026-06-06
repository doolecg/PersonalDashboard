export async function mockMessages() {
    return [
        { id: "msg-1", name: "Morgan", initials: "MO", preview: "Can you confirm the build window before noon?", time: "8:42 AM", unread: true, needsReply: true },
        { id: "msg-2", name: "Sam", initials: "SA", preview: "Tunnel checks passed. I left notes in the deployment log.", time: "7:18 AM", unread: true, needsReply: false },
        { id: "msg-3", name: "Alex", initials: "AL", preview: "I can review the OpenRouter fallback later today.", time: "Yesterday", unread: true, needsReply: true }
    ];
}
