import { env } from "./env.js";
import { readObject, writeObject } from "./store/collectionStore.js";
// Non-secret runtime config the user can set in Settings. The "local" AI provider
// is a choice between LM Studio (OpenAI-compatible) and Ollama (native API), each
// with its own server URL and model. The picker writes the chosen provider's
// values onto the matching env fields, which the adapters read lazily.
export const configFields = ["localAiProvider", "localAiBaseUrl", "localAiModel"];
const storeName = "server-config";
let provider = "lmstudio";
// The .env defaults captured at load time, per provider.
const envDefaults = {
    lmstudio: { baseUrl: env.openAiCompatBaseUrl, model: env.openAiCompatModel },
    ollama: { baseUrl: env.ollamaBaseUrl, model: env.ollamaModel }
};
function setEnv(key, value) {
    env[key] = value;
}
// Accept a bare host:port (e.g. http://127.0.0.1:1234) and point it at the
// OpenAI-compatible path, while leaving an explicit path (…/v1) untouched.
// Ollama uses its own native paths, so its base URL is left as-is.
export function normalizeBaseUrl(url) {
    const trimmed = url.trim().replace(/\/+$/, "");
    if (!trimmed)
        return "";
    try {
        const parsed = new URL(trimmed);
        if (parsed.pathname === "" || parsed.pathname === "/")
            return `${trimmed}/v1`;
        return trimmed;
    }
    catch {
        return trimmed;
    }
}
function applyProvider(target, settings) {
    const baseUrl = settings.baseUrl?.trim();
    const model = settings.model?.trim();
    if (target === "ollama") {
        if (baseUrl)
            setEnv("ollamaBaseUrl", baseUrl);
        if (model)
            setEnv("ollamaModel", model);
    }
    else {
        if (baseUrl)
            setEnv("openAiCompatBaseUrl", normalizeBaseUrl(baseUrl));
        if (model)
            setEnv("openAiCompatModel", model);
    }
}
export function getLocalProvider() {
    return provider;
}
export async function applyServerConfig() {
    const stored = (await readObject(storeName)) ?? {};
    if (stored.provider === "lmstudio" || stored.provider === "ollama")
        provider = stored.provider;
    if (stored.lmstudio)
        applyProvider("lmstudio", stored.lmstudio);
    if (stored.ollama)
        applyProvider("ollama", stored.ollama);
}
// Returns the active provider plus its current (post-override) URL and model, so
// the Settings inputs always show what's actually in use for the chosen provider.
export function getServerConfig() {
    const active = provider === "ollama"
        ? { baseUrl: String(env.ollamaBaseUrl ?? ""), model: String(env.ollamaModel ?? "") }
        : { baseUrl: String(env.openAiCompatBaseUrl ?? ""), model: String(env.openAiCompatModel ?? "") };
    return { localAiProvider: provider, localAiBaseUrl: active.baseUrl, localAiModel: active.model };
}
/** Block cloud-metadata and non-HTTP schemes; allows localhost and LAN addresses. */
function isSafeLocalUrl(raw) {
    if (!raw.trim())
        return true; // empty → falls back to env default
    try {
        const parsed = new URL(raw.trim());
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
            return false;
        const host = parsed.hostname.toLowerCase();
        // Block link-local and cloud metadata endpoints (169.254.x.x, fe80::)
        if (/^169\.254\./.test(host) || /^fe80:/i.test(host))
            return false;
        return true;
    }
    catch {
        return false;
    }
}
// Query a running local server for the model(s) it currently has loaded.
// LM Studio / llama.cpp expose the OpenAI-compatible /v1/models; Ollama exposes
// its native /api/tags. Returns model ids/names, empty if unreachable.
export async function detectLocalModels(target, baseUrlInput) {
    if (!isSafeLocalUrl(baseUrlInput))
        return [];
    const raw = baseUrlInput.trim() || envDefaults[target].baseUrl;
    try {
        if (target === "ollama") {
            const base = raw.replace(/\/+$/, "");
            const response = await fetch(`${base}/api/tags`);
            if (!response.ok)
                return [];
            const data = (await response.json());
            return (data.models ?? []).map((model) => model.name ?? "").filter(Boolean);
        }
        const base = normalizeBaseUrl(raw);
        const response = await fetch(`${base}/models`);
        if (!response.ok)
            return [];
        const data = (await response.json());
        return (data.data ?? []).map((model) => model.id ?? "").filter(Boolean);
    }
    catch {
        return [];
    }
}
export async function updateServerConfig(patch) {
    const stored = (await readObject(storeName)) ?? {};
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
