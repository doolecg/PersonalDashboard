import { env } from "./env.js";
import { readObject, writeObject } from "./store/collectionStore.js";

// Non-secret runtime config the user can set in Settings. The "local" AI provider
// is a choice between LM Studio (OpenAI-compatible) and Ollama (native API), each
// with its own server URL and model. The picker writes the chosen provider's
// values onto the matching env fields, which the adapters read lazily.
export const configFields = ["localAiProvider", "localAiBaseUrl", "localAiModel"] as const;
export type ConfigField = (typeof configFields)[number];
export type LocalProvider = "lmstudio" | "ollama";

type ProviderSettings = { baseUrl?: string; model?: string };
type Stored = {
  provider?: LocalProvider;
  lmstudio?: ProviderSettings;
  ollama?: ProviderSettings;
};

const storeName = "server-config";

let provider: LocalProvider = "lmstudio";

// The .env defaults captured at load time, per provider.
const envDefaults: Record<LocalProvider, Required<ProviderSettings>> = {
  lmstudio: { baseUrl: env.openAiCompatBaseUrl, model: env.openAiCompatModel },
  ollama: { baseUrl: env.ollamaBaseUrl, model: env.ollamaModel }
};

function setEnv(key: "openAiCompatBaseUrl" | "openAiCompatModel" | "ollamaBaseUrl" | "ollamaModel", value: string) {
  (env as Record<string, unknown>)[key] = value;
}

// Accept a bare host:port (e.g. http://127.0.0.1:1234) and point it at the
// OpenAI-compatible path, while leaving an explicit path (…/v1) untouched.
// Ollama uses its own native paths, so its base URL is left as-is.
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

function applyProvider(target: LocalProvider, settings: ProviderSettings) {
  const baseUrl = settings.baseUrl?.trim();
  const model = settings.model?.trim();
  if (target === "ollama") {
    if (baseUrl) setEnv("ollamaBaseUrl", baseUrl);
    if (model) setEnv("ollamaModel", model);
  } else {
    if (baseUrl) setEnv("openAiCompatBaseUrl", normalizeBaseUrl(baseUrl));
    if (model) setEnv("openAiCompatModel", model);
  }
}

export function getLocalProvider(): LocalProvider {
  return provider;
}

export async function applyServerConfig(): Promise<void> {
  const stored = (await readObject<Stored>(storeName)) ?? {};
  if (stored.provider === "lmstudio" || stored.provider === "ollama") provider = stored.provider;
  if (stored.lmstudio) applyProvider("lmstudio", stored.lmstudio);
  if (stored.ollama) applyProvider("ollama", stored.ollama);
}

// Returns the active provider plus its current (post-override) URL and model, so
// the Settings inputs always show what's actually in use for the chosen provider.
export function getServerConfig(): Record<ConfigField, string> {
  const active =
    provider === "ollama"
      ? { baseUrl: String(env.ollamaBaseUrl ?? ""), model: String(env.ollamaModel ?? "") }
      : { baseUrl: String(env.openAiCompatBaseUrl ?? ""), model: String(env.openAiCompatModel ?? "") };
  return { localAiProvider: provider, localAiBaseUrl: active.baseUrl, localAiModel: active.model };
}

// Query a running local server for the model(s) it currently has loaded.
// LM Studio / llama.cpp expose the OpenAI-compatible /v1/models; Ollama exposes
// its native /api/tags. Returns model ids/names, empty if unreachable.
export async function detectLocalModels(target: LocalProvider, baseUrlInput: string): Promise<string[]> {
  const raw = baseUrlInput.trim() || envDefaults[target].baseUrl;
  try {
    if (target === "ollama") {
      const base = raw.replace(/\/+$/, "");
      const response = await fetch(`${base}/api/tags`);
      if (!response.ok) return [];
      const data = (await response.json()) as { models?: Array<{ name?: string }> };
      return (data.models ?? []).map((model) => model.name ?? "").filter(Boolean);
    }
    const base = normalizeBaseUrl(raw);
    const response = await fetch(`${base}/models`);
    if (!response.ok) return [];
    const data = (await response.json()) as { data?: Array<{ id?: string }> };
    return (data.data ?? []).map((model) => model.id ?? "").filter(Boolean);
  } catch {
    return [];
  }
}

export async function updateServerConfig(patch: Partial<Record<ConfigField, string>>): Promise<void> {
  const stored = (await readObject<Stored>(storeName)) ?? {};

  if (patch.localAiProvider === "lmstudio" || patch.localAiProvider === "ollama") {
    provider = patch.localAiProvider;
    stored.provider = provider;
  }

  if (patch.localAiBaseUrl !== undefined || patch.localAiModel !== undefined) {
    const current = stored[provider] ?? {};
    if (patch.localAiBaseUrl !== undefined) {
      const value = patch.localAiBaseUrl.trim();
      current.baseUrl = value || envDefaults[provider].baseUrl;
    }
    if (patch.localAiModel !== undefined) {
      const value = patch.localAiModel.trim();
      current.model = value || envDefaults[provider].model;
    }
    stored[provider] = current;
    applyProvider(provider, current);
  }

  await writeObject(storeName, stored);
}
