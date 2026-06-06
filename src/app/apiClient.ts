import type { AiRoutingMode, AiUsageSnapshot } from "../types/models";

export async function getAiStatus(): Promise<AiUsageSnapshot> {
  const response = await fetch("/api/ai/status");
  if (!response.ok) throw new Error(`AI status failed with ${response.status}`);
  return response.json() as Promise<AiUsageSnapshot>;
}

export async function setAiMode(mode: AiRoutingMode): Promise<AiUsageSnapshot> {
  const response = await fetch("/api/ai/status", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode })
  });
  if (!response.ok) throw new Error(`AI mode failed with ${response.status}`);
  return response.json() as Promise<AiUsageSnapshot>;
}
