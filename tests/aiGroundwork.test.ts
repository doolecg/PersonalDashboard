import { describe, expect, it } from "vitest";
import { appendChatExchange, updateAndTruncateChat, updateChatMessage } from "../src/modules/chat";

describe("AI chat groundwork", () => {
  it("keeps editable message logs", () => {
    const messages = appendChatExchange([], "hello", "2026-06-06T12:00:00.000Z", "msg-1");
    expect(messages).toHaveLength(2);

    const updated = updateChatMessage(messages, "msg-1-assistant", "hi");
    expect(updated[1]?.content).toBe("hi");
  });

  it("truncates later messages when editing a prompt", () => {
    const messages = [
      ...appendChatExchange([], "first", "2026-06-06T12:00:00.000Z", "msg-1"),
      ...appendChatExchange([], "second", "2026-06-06T12:01:00.000Z", "msg-2")
    ];

    const updated = updateAndTruncateChat(messages, "msg-1-user", "edited");
    expect(updated).toEqual([{ id: "msg-1-user", role: "user", content: "edited", createdAt: "2026-06-06T12:00:00.000Z" }]);
  });
});
