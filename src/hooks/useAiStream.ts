import { useCallback, useRef, useState } from "react";
import type { AiUsageSnapshot, AuraContext } from "../types/models";

export function useAiStream() {
  const [answer, setAnswer] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AiUsageSnapshot | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const send = useCallback(async (prompt: string, context: Partial<AuraContext>) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setAnswer("");
    setError(null);
    setIsStreaming(true);
    let nextAnswer = "";
    try {
      const response = await fetch("/api/ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, context }),
        signal: controller.signal
      });
      if (!response.ok || !response.body) throw new Error(`AI stream failed with ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const event of events) {
          const eventName = event.match(/^event:\s*(.+)$/m)?.[1];
          const dataText = event.match(/^data:\s*(.+)$/m)?.[1];
          if (!eventName || !dataText) continue;
          const data = JSON.parse(dataText) as { token?: string; message?: string } | AiUsageSnapshot;
          if (eventName === "token" && "token" in data && data.token) {
            nextAnswer += data.token;
            setAnswer(nextAnswer);
          }
          if (eventName === "done") setStatus(data as AiUsageSnapshot);
          if (eventName === "error") throw new Error("message" in data ? data.message ?? "AI unavailable" : "AI unavailable");
        }
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) setError(err instanceof Error ? err.message : "AI unavailable");
    } finally {
      setIsStreaming(false);
      controllerRef.current = null;
    }
    return nextAnswer;
  }, []);

  const stop = useCallback(() => controllerRef.current?.abort(), []);

  return { answer, isStreaming, error, status, send, stop };
}
