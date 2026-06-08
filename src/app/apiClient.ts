import type { AiRoutingMode, AiUsageSnapshot } from "../types/models";
import type { DashboardLocation } from "@/app/preferences/preferences";
import type { WeatherReport, WeatherWidgetPayload } from "@/features/cards/weather/types";

export type GeocodeLocationResult = DashboardLocation & {
  admin1?: string;
  country?: string;
  label: string;
};

function withWeatherLocation(path: string, location?: DashboardLocation | null) {
  if (!location) return path;

  const params = new URLSearchParams({
    lat: String(location.latitude),
    lon: String(location.longitude),
    city: location.name
  });

  return `${path}?${params.toString()}`;
}

export async function getAiStatus(): Promise<AiUsageSnapshot> {
  const response = await fetch("/api/ai/status");
  if (!response.ok) throw new Error(`AI status failed with ${response.status}`);
  return response.json() as Promise<AiUsageSnapshot>;
}

export async function setAiMode(mode: AiRoutingMode): Promise<AiUsageSnapshot> {
  return setAiSelection({ mode });
}

export async function setAiSelection(selection: { mode?: AiRoutingMode; model?: string | null }): Promise<AiUsageSnapshot> {
  const response = await fetch("/api/ai/status", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(selection)
  });
  if (!response.ok) throw new Error(`AI selection failed with ${response.status}`);
  return response.json() as Promise<AiUsageSnapshot>;
}

export async function getWeatherData(location?: DashboardLocation | null): Promise<WeatherWidgetPayload> {
  const response = await fetch(withWeatherLocation("/api/weather", location));
  if (!response.ok) throw new Error(`Weather request failed with ${response.status}`);
  return response.json() as Promise<WeatherWidgetPayload>;
}

export async function getWeatherReport(location?: DashboardLocation | null): Promise<WeatherReport> {
  const response = await fetch(withWeatherLocation("/api/weather/report", location));
  if (!response.ok) throw new Error(`Weather report failed with ${response.status}`);
  return response.json() as Promise<WeatherReport>;
}

export async function geocodeLocation(query: string): Promise<GeocodeLocationResult[]> {
  const params = new URLSearchParams({ q: query });
  const response = await fetch(`/api/weather/geocode?${params.toString()}`);
  if (!response.ok) throw new Error(`Location search failed with ${response.status}`);
  const payload = (await response.json()) as { results?: GeocodeLocationResult[] };
  return payload.results ?? [];
}

export type Note = { id: string; text: string; updatedAt: string; title?: string; color?: string };
export type Todo = { id: string; text: string; done: boolean; createdAt: string };
export type Reminder = { id: string; text: string; due?: string; done: boolean };

async function getCollection<T>(name: string): Promise<T[]> {
  const response = await fetch(`/api/${name}`);
  if (!response.ok) throw new Error(`Failed to load ${name} (${response.status})`);
  const payload = (await response.json()) as { items?: T[] };
  return payload.items ?? [];
}

async function saveCollection<T>(name: string, items: T[]): Promise<T[]> {
  const response = await fetch(`/api/${name}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items })
  });
  if (!response.ok) throw new Error(`Failed to save ${name} (${response.status})`);
  const payload = (await response.json()) as { items?: T[] };
  return payload.items ?? items;
}

export type AssistantChatMessage = { role: "user" | "assistant"; content: string };
export type AssistantResult = { reply: string; toolCalls: Array<{ name: string }> };

export async function sendAssistantMessage(
  messages: AssistantChatMessage[],
  context?: Record<string, unknown>
): Promise<AssistantResult> {
  const response = await fetch("/api/ai/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, context })
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(payload.message ?? `Assistant failed with ${response.status}`);
  }
  return response.json() as Promise<AssistantResult>;
}

export type NewsHeadline = { source: string; title: string; url: string; image?: string };
export type NewsSummary = { summary: string; headlines: NewsHeadline[]; source: "ai" | "headlines" };

export async function getNewsSummary(): Promise<NewsSummary> {
  const response = await fetch("/api/ai/news-summary");
  if (!response.ok) throw new Error(`News summary failed with ${response.status}`);
  return response.json() as Promise<NewsSummary>;
}

export type TldrHeadline = { title: string; url?: string; image?: string; source: string };
export type TldrTopic = { label: string; tldr: string; source: "ai" | "headlines"; headlines: TldrHeadline[] };
export type TldrSummary = { topics: TldrTopic[] };

export async function getTldr(): Promise<TldrSummary> {
  const response = await fetch("/api/ai/tldr");
  if (!response.ok) throw new Error(`TLDR failed with ${response.status}`);
  return response.json() as Promise<TldrSummary>;
}

export type LifeSummaryEvent = { title: string; start: string; end?: string; location?: string; category?: string };
export type LifeSummary = { summary: string; source: "ai" | "fallback" };

export async function getLifeSummary(
  events: LifeSummaryEvent[],
  weather?: string,
  tasks?: string[],
  reminders?: string[],
  news?: string[],
  advice?: string
): Promise<LifeSummary> {
  const response = await fetch("/api/ai/life-summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events, weather, tasks, reminders, news, advice })
  });
  if (!response.ok) throw new Error(`Life summary failed with ${response.status}`);
  return response.json() as Promise<LifeSummary>;
}

export type SecretStatus = { set: boolean; preview: string };
export type SecretsStatus = Record<string, SecretStatus>;

export async function getSecrets(): Promise<SecretsStatus> {
  const response = await fetch("/api/settings/secrets");
  if (!response.ok) throw new Error(`Failed to load settings (${response.status})`);
  const payload = (await response.json()) as { secrets?: SecretsStatus };
  return payload.secrets ?? {};
}

export async function updateSecrets(patch: Record<string, string>): Promise<SecretsStatus> {
  const response = await fetch("/api/settings/secrets", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch)
  });
  if (!response.ok) throw new Error(`Failed to save settings (${response.status})`);
  const payload = (await response.json()) as { secrets?: SecretsStatus };
  return payload.secrets ?? {};
}

export type LocalAiProvider = "lmstudio" | "ollama";
export type ServerConfig = { localAiProvider: LocalAiProvider; localAiBaseUrl: string; localAiModel: string };

const emptyServerConfig: ServerConfig = { localAiProvider: "lmstudio", localAiBaseUrl: "", localAiModel: "" };

export async function getServerConfig(): Promise<ServerConfig> {
  const response = await fetch("/api/settings/config");
  if (!response.ok) throw new Error(`Failed to load config (${response.status})`);
  const payload = (await response.json()) as { config?: ServerConfig };
  return payload.config ?? emptyServerConfig;
}

export async function updateServerConfig(patch: Partial<ServerConfig>): Promise<ServerConfig> {
  const response = await fetch("/api/settings/config", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch)
  });
  if (!response.ok) throw new Error(`Failed to save config (${response.status})`);
  const payload = (await response.json()) as { config?: ServerConfig };
  return payload.config ?? emptyServerConfig;
}

export async function detectLocalModels(provider: LocalAiProvider, baseUrl: string): Promise<string[]> {
  const response = await fetch("/api/settings/local/detect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, baseUrl })
  });
  if (!response.ok) throw new Error(`Failed to detect models (${response.status})`);
  const payload = (await response.json()) as { models?: string[] };
  return payload.models ?? [];
}

export type GoogleStatus = { configured: boolean; connected: boolean };

export async function getGoogleStatus(): Promise<GoogleStatus> {
  const response = await fetch("/api/google/status");
  if (!response.ok) throw new Error(`Google status failed (${response.status})`);
  return response.json() as Promise<GoogleStatus>;
}

export async function disconnectGoogle(): Promise<void> {
  await fetch("/api/google/disconnect", { method: "POST" });
}

export type CalendarEventDTO = {
  id: string;
  title: string;
  start: string;
  end?: string;
  location?: string;
  description?: string;
  category?: string;
};

export async function getGoogleEvents(): Promise<CalendarEventDTO[]> {
  const response = await fetch("/api/google/events");
  if (!response.ok) throw new Error(`Google events failed (${response.status})`);
  const payload = (await response.json()) as { events?: CalendarEventDTO[] };
  return payload.events ?? [];
}

export const getNotes = () => getCollection<Note>("notes");
export const saveNotes = (items: Note[]) => saveCollection("notes", items);
export const getTodos = () => getCollection<Todo>("todos");
export const saveTodos = (items: Todo[]) => saveCollection("todos", items);
export const getReminders = () => getCollection<Reminder>("reminders");
export const saveReminders = (items: Reminder[]) => saveCollection("reminders", items);
// Server-backed calendar events (e.g. ones the AI assistant creates), merged
// with the browser's local events by the calendar cards.
export const getEvents = () => getCollection<CalendarEventDTO>("events");
export const saveEvents = (items: CalendarEventDTO[]) => saveCollection("events", items);
