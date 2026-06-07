import { env } from "./env.js";
import { readObject, writeObject } from "./store/collectionStore.js";

// Non-secret runtime config the user can set in Settings (unlike secrets these
// are shown in full). Currently: the local AI server (OpenAI-compatible, e.g.
// LM Studio / Ollama / llama.cpp). These override the matching env fields, which
// the local adapter reads lazily — so changes take effect immediately.
export const configFields = ["localAiBaseUrl", "localAiModel"] as const;
export type ConfigField = (typeof configFields)[number];

const envMap: Record<ConfigField, "openAiCompatBaseUrl" | "openAiCompatModel"> = {
  localAiBaseUrl: "openAiCompatBaseUrl",
  localAiModel: "openAiCompatModel"
};

const storeName = "server-config";

const envDefaults: Record<ConfigField, string> = configFields.reduce((acc, field) => {
  acc[field] = String((env as Record<string, unknown>)[envMap[field]] ?? "");
  return acc;
}, {} as Record<ConfigField, string>);

function setEnv(field: ConfigField, value: string) {
  (env as Record<string, unknown>)[envMap[field]] = value;
}

// Accept a bare host:port (e.g. http://127.0.0.1:1234) and point it at the
// OpenAI-compatible path, while leaving an explicit path (…/v1) untouched.
export function normalizeBaseUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname === "" || parsed.pathname === "/") return `${trimmed}/v1`;
    return trimmed;
  } catch {
    return trimmed;
  }
}

export async function applyServerConfig(): Promise<void> {
  const overrides = (await readObject<Partial<Record<ConfigField, string>>>(storeName)) ?? {};
  for (const field of configFields) {
    const value = overrides[field];
    if (typeof value === "string" && value) {
      setEnv(field, field === "localAiBaseUrl" ? normalizeBaseUrl(value) : value);
    }
  }
}

// Returns the active values (post-override), so the Settings inputs always show
// what's actually in use.
export function getServerConfig(): Record<ConfigField, string> {
  return configFields.reduce((acc, field) => {
    acc[field] = String((env as Record<string, unknown>)[envMap[field]] ?? "");
    return acc;
  }, {} as Record<ConfigField, string>);
}

export async function updateServerConfig(patch: Partial<Record<ConfigField, string>>): Promise<void> {
  const overrides = (await readObject<Partial<Record<ConfigField, string>>>(storeName)) ?? {};
  for (const field of configFields) {
    if (!(field in patch)) continue;
    const raw = patch[field];
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (trimmed) {
      const value = field === "localAiBaseUrl" ? normalizeBaseUrl(trimmed) : trimmed;
      overrides[field] = value;
      setEnv(field, value);
    } else {
      delete overrides[field];
      setEnv(field, envDefaults[field]);
    }
  }
  await writeObject(storeName, overrides);
}
