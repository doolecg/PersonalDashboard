import { createOpenAiProvider } from "../adapters/openAiProvider.js";
import { createOpenRouterProvider } from "../adapters/openRouterProvider.js";
import { createGeminiProvider } from "../adapters/geminiProvider.js";
import { llamaCppOpenAiProvider } from "../adapters/llamaCppOpenAiProvider.js";
import { ollamaProvider } from "../adapters/ollamaProvider.js";
import { env } from "../env.js";
import { logger } from "../logger.js";
import { readObject, writeObject } from "../store/collectionStore.js";
const modes = ["auto", "openrouter", "gemini", "openai", "local"];
let currentMode = modes.includes(env.aiRoutingMode) ? env.aiRoutingMode : "auto";
// A specific model the user pinned in Settings (provider inferred from the mode).
// null = let the mode pick (auto tries everything).
let selectedModel = null;
const selectionStore = "ai-selection";
// The models the Settings picker can offer per provider.
function providerModels() {
    return {
        openrouter: env.openRouterFreeModels,
        openai: [env.openAiModel],
        gemini: [env.geminiModel],
        local: [env.ollamaModel, env.openAiCompatModel]
    };
}
// Build a single attempt for a pinned model, inferring the provider from the mode
// (auto pins to OpenRouter, where the selectable free-model list lives).
function pinnedAttempt(mode, model) {
    if (mode === "gemini")
        return attempt("gemini", model, createGeminiProvider(model));
    if (mode === "openai")
        return attempt("openai", model, createOpenAiProvider(model));
    if (mode === "local") {
        return model === env.openAiCompatModel
            ? attempt("openai-compatible", model, llamaCppOpenAiProvider)
            : attempt("ollama", model, ollamaProvider);
    }
    return attempt("openrouter", model, createOpenRouterProvider(model));
}
export async function applyStoredAiSelection() {
    const stored = await readObject(selectionStore);
    if (!stored)
        return;
    if (stored.mode && modes.includes(stored.mode))
        currentMode = stored.mode;
    selectedModel = typeof stored.model === "string" && stored.model ? stored.model : null;
}
function persistAiSelection() {
    void writeObject(selectionStore, { mode: currentMode, model: selectedModel }).catch(() => undefined);
}
const usage = {
    activeProvider: "none",
    activeModel: "none",
    requests: 0,
    failures: 0,
    estimatedPromptTokens: 0,
    estimatedCompletionTokens: 0,
    lastError: undefined,
    lastAttempts: [],
    updatedAt: new Date().toISOString()
};
function estimateTokens(text) {
    return Math.max(1, Math.ceil(text.length / 4));
}
function requestTokenEstimate(request) {
    return estimateTokens(request.messages.map((message) => message.content).join("\n"));
}
function recordSuccess(request, message, provider, model, attempts) {
    usage.activeProvider = provider;
    usage.activeModel = model;
    usage.requests += 1;
    usage.estimatedPromptTokens += requestTokenEstimate(request);
    usage.estimatedCompletionTokens += estimateTokens(message);
    usage.lastError = undefined;
    usage.lastAttempts = attempts;
    usage.updatedAt = new Date().toISOString();
}
function recordFailure(message, attempts) {
    usage.failures += 1;
    usage.lastError = message;
    usage.lastAttempts = attempts;
    usage.updatedAt = new Date().toISOString();
}
function attempt(providerName, model, provider) {
    return { provider, providerName, model };
}
function localAttempts() {
    // OpenAI-compatible first — it's the user-configurable local server URL
    // (LM Studio / llama.cpp), then Ollama on its native endpoint.
    return [
        attempt("openai-compatible", env.openAiCompatModel, llamaCppOpenAiProvider),
        attempt("ollama", env.ollamaModel, ollamaProvider)
    ];
}
function baseAttemptsForMode(mode) {
    if (mode === "local")
        return localAttempts();
    if (mode === "gemini")
        return [attempt("gemini", env.geminiModel, createGeminiProvider(env.geminiModel))];
    if (mode === "openai")
        return [attempt("openai", env.openAiModel, createOpenAiProvider(env.openAiModel))];
    const openRouterAttempts = env.openRouterFreeModels.map((model) => attempt("openrouter", model, createOpenRouterProvider(model)));
    if (mode === "openrouter")
        return openRouterAttempts;
    return [
        ...openRouterAttempts,
        attempt("gemini", env.geminiModel, createGeminiProvider(env.geminiModel)),
        attempt("openai", env.openAiModel, createOpenAiProvider(env.openAiModel)),
        ...localAttempts()
    ];
}
function attemptsForMode(mode) {
    const base = baseAttemptsForMode(mode);
    if (!selectedModel)
        return base;
    // Try the pinned model first, then fall back to the rest so a single dead free
    // model doesn't take the assistant down.
    return [pinnedAttempt(mode, selectedModel), ...base.filter((candidate) => candidate.model !== selectedModel)];
}
function canSkipProvider(error) {
    return /authentication failed|api_key is not configured/i.test(error.message);
}
function fallbackAttempts() {
    return [];
}
export function getAiStatus() {
    return {
        mode: currentMode,
        selectedModel,
        activeProvider: usage.activeProvider,
        activeModel: usage.activeModel,
        requests: usage.requests,
        failures: usage.failures,
        estimatedPromptTokens: usage.estimatedPromptTokens,
        estimatedCompletionTokens: usage.estimatedCompletionTokens,
        estimatedTotalTokens: usage.estimatedPromptTokens + usage.estimatedCompletionTokens,
        lastError: usage.lastError,
        lastAttempts: usage.lastAttempts,
        availableModes: modes,
        openRouterModels: env.openRouterFreeModels,
        providerModels: providerModels(),
        updatedAt: usage.updatedAt
    };
}
export function setAiRoutingMode(mode) {
    currentMode = mode;
    usage.updatedAt = new Date().toISOString();
    persistAiSelection();
}
// Set the routing mode (provider) and/or a pinned model. Passing model === null
// clears the pin; an unset model leaves the current pin untouched.
export function setAiSelection({ mode, model }) {
    if (mode && modes.includes(mode))
        currentMode = mode;
    if (model !== undefined)
        selectedModel = typeof model === "string" && model ? model : null;
    usage.updatedAt = new Date().toISOString();
    persistAiSelection();
}
export function isAiRoutingMode(value) {
    return typeof value === "string" && modes.includes(value);
}
export async function routeAiComplete(request) {
    const attempts = [];
    const blockedProviders = new Set();
    const candidates = [...attemptsForMode(currentMode), ...fallbackAttempts()];
    for (const candidate of candidates) {
        if (blockedProviders.has(candidate.providerName))
            continue;
        const at = new Date().toISOString();
        try {
            const message = await candidate.provider.complete(request);
            if (!message.trim())
                throw new Error(`${candidate.providerName} returned an empty response.`);
            attempts.push({ provider: candidate.providerName, model: candidate.model, status: "ok", at });
            recordSuccess(request, message, candidate.providerName, candidate.model, attempts);
            return { message, fallback: false, provider: candidate.providerName, model: candidate.model, attempts };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "AI provider unavailable";
            attempts.push({ provider: candidate.providerName, model: candidate.model, status: "failed", message, at });
            logger.warn("AI provider attempt failed", { provider: candidate.providerName, model: candidate.model, message });
            if (error instanceof Error && canSkipProvider(error))
                blockedProviders.add(candidate.providerName);
        }
    }
    const message = attempts.at(-1)?.message ?? "AI unavailable";
    recordFailure(message, attempts);
    logger.error("AI routing failed", message, { attempts });
    throw new Error(message);
}
export async function* routeAiStream(request) {
    const result = await routeAiComplete(request);
    yield result.message;
}
