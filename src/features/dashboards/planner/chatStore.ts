import type { AssistantChatMessage } from "@/app/apiClient";

// Module-level store so chat history survives dashboard tab switches.
let messages: AssistantChatMessage[] = [];

export function getChatMessages(): AssistantChatMessage[] {
  return messages;
}

export function setChatMessages(next: AssistantChatMessage[]): void {
  messages = next;
}
