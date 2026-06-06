export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
};

export function updateChatMessage(messages: ChatMessage[], id: string, content: string) {
  return messages.map((message) => (message.id === id ? { ...message, content } : message));
}

export function updateAndTruncateChat(messages: ChatMessage[], id: string, content: string) {
  const index = messages.findIndex((message) => message.id === id);
  if (index < 0) return messages;
  return updateChatMessage(messages.slice(0, index + 1), id, content);
}

export function appendChatExchange(messages: ChatMessage[], prompt: string, now: string, idPrefix: string) {
  return [
    ...messages,
    { id: `${idPrefix}-user`, role: "user" as const, content: prompt, createdAt: now },
    { id: `${idPrefix}-assistant`, role: "assistant" as const, content: "", createdAt: now }
  ];
}
