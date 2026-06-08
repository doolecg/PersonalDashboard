import { createOpenAiProvider } from "../adapters/openAiProvider.js";
import { createOpenRouterProvider } from "../adapters/openRouterProvider.js";
import { createGeminiProvider } from "../adapters/geminiProvider.js";
import { llamaCppOpenAiProvider } from "../adapters/llamaCppOpenAiProvider.js";
import { ollamaProvider } from "../adapters/ollamaProvider.js";
import { env } from "../env.js";
import { logger } from "../logger.js";
import { readObject, writeObject } from "../store/collectionStore.js";
import { getLocalProvider } from "../serverConfig.js";
import type { AiProvider } from "./aiProvider.js";
import type { AiRequest, AiRouteAttempt, AiRoutingMode, AiUsageSnapshot } from "../types/models.js";

type Attempt = {
  provider: AiProvider;
  providerName: string;
  model: string;
};

type RouteResult = {
  message: string;
  fallback: boolean;
  provider: string;
  model: string;
  attempts: AiRouteAttempt[];
};

const modes: AiRoutingMode[] = ["auto", "openrouter", "gemini", "openai", "local"];

let currentMode = modes.includes(env.aiRoutingMode as AiRoutingMode) ? (env.aiRoutingMode as AiRoutingMode) : "auto";
// A specific model the user pinned in Settings (provider inferred from the mode).
// null = let the mode pick (auto tries everything).
let selectedModel: string | null = null;

const selectionStore = "ai-selection";

// The models the Settings picker can offer per provider.
function providerModels(): Partial<Record<AiRoutingMode, string[]>> {
  return {
    openrouter: env.openRouterFreeModels,
    openai: [env.openAiModel],
    gemini: [env.geminiModel],
    local: [env.ollamaModel, env.openAiCompatModel]
  };
}

// Build a single attempt for a pinned model, inferring the provider from the mode
// (auto pins to OpenRouter, where the selectable free-model list lives).
function pinnedAttempt(mode: AiRoutingMode, model: string): Attempt {
  if (mode === "gemini") return attempt("gemini", model, createGeminiProvider(model));
  if (mode === "openai") return attempt("openai", model, createOpenAiProvider(model));
  if (mode === "local") {
    return model === env.openAiCompatModel
      ? attempt("openai-compatible", model, llamaCppOpenAiProvider)
      : attempt("ollama", model, ollamaProvider);
  }
  return attempt("openrouter", model, createOpenRouterProvider(model));
}

export async function applyStoredAiSelection(): Promise<void> {
  const stored = await readObject<{ mode?: AiRoutingMode; model?: string | null }>(selectionStore);
  if (!stored) return;
  if (stored.mode && modes.includes(stored.mode)) currentMode = stored.mode;
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
  lastError: undefined as string | undefined,
  lastAttempts: [] as AiRouteAttempt[],
  updatedAt: new Date().toISOString()
};

function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}

function requestTokenEstimate(request: AiRequest) {
  return estimateTokens(request.messages.map((message) => message.content).join("\n"));
}

function recordSuccess(request: AiRequest, message: string, provider: string, model: string, attempts: AiRouteAttempt[]) {
  usage.activeProvider = provider;
  usage.activeModel = model;
  usage.requests += 1;
  usage.estimatedPromptTokens += requestTokenEstimate(request);
  usage.estimatedCompletionTokens += estimateTokens(message);
  usage.lastError = undefined;
  usage.lastAttempts = attempts;
  usage.updatedAt = new Date().toISOString();
}

function recordFailure(message: string, attempts: AiRouteAttempt[]) {
  usage.failures += 1;
  usage.lastError = message;
  usage.lastAttempts = attempts;
  usage.updatedAt = new Date().toISOString();
}

function attempt(providerName: string, model: string, provider: AiProvider): Attempt {
  return { provider, providerName, model };
}

function localAttempts(): Attempt[] {
  // Use only the local provider the user picked in Settings (LM Studio's
  // OpenAI-compatible server, or Ollama's native endpoint) — don't fan out to
  // the other and rack up failures for a backend that isn't running.
  return getLocalProvider() === "ollama"
    ? [attempt("ollama", env.ollamaModel, ollamaProvider)]
    : [attempt("openai-compatible", env.openAiCompatModel, llamaCppOpenAiProvider)];
}

function baseAttemptsForMode(mode: AiRoutingMode): Attempt[] {
  if (mode === "local") return localAttempts();
  if (mode === "gemini") return [attempt("gemini", env.geminiModel, createGeminiProvider(env.geminiModel))];
  if (mode === "openai") return [attempt("openai", env.openAiModel, createOpenAiProvider(env.openAiModel))];

  const openRouterAttempts = env.openRouterFreeModels.map((model) => attempt("openrouter", model, createOpenRouterProvider(model)));
  if (mode === "openrouter") return openRouterAttempts;

  return [
    ...openRouterAttempts,
    attempt("gemini", env.geminiModel, createGeminiProvider(env.geminiModel)),
    attempt("openai", env.openAiModel, createOpenAiProvider(env.openAiModel)),
    ...localAttempts()
  ];
}

function attemptsForMode(mode: AiRoutingMode): Attempt[] {
  const base = baseAttemptsForMode(mode);
  if (!selectedModel) return base;
  // Try the pinned model first, then fall back to the rest so a single dead free
  // model doesn't take the assistant down.
  return [pinnedAttempt(mode, selectedModel), ...base.filter((candidate) => candidate.model !== selectedModel)];
}

function canSkipProvider(error: Error) {
  return /authentication failed|api_key is not configured/i.test(error.message);
}

// A model that returns a rate-limit/quota error is put on a cooldown so the next
// request starts from a fresh free model instead of re-hitting the limited one.
const rateLimitedUntil = new Map<string, number>();
const RATE_LIMIT_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(error: Error) {
  return /rate.?limit|quota|429|too many requests|temporarily/i.test(error.message);
}

function fallbackAttempts() {
  return [];
}

export function getAiStatus(): AiUsageSnapshot {
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

export function setAiRoutingMode(mode: AiRoutingMode) {
  currentMode = mode;
  usage.updatedAt = new Date().toISOString();
  persistAiSelection();
}

// Set the routing mode (provider) and/or a pinned model. Passing model === null
// clears the pin; an unset model leaves the current pin untouched.
export function setAiSelection({ mode, model }: { mode?: AiRoutingMode; model?: string | null }) {
  if (mode && modes.includes(mode)) currentMode = mode;
  if (model !== undefined) selectedModel = typeof model === "string" && model ? model : null;
  usage.updatedAt = new Date().toISOString();
  persistAiSelection();
}

export function isAiRoutingMode(value: unknown): value is AiRoutingMode {
  return typeof value === "string" && modes.includes(value as AiRoutingMode);
}

export async function routeAiComplete(request: AiRequest): Promise<RouteResult> {
  const attempts: AiRouteAttempt[] = [];
  const blockedProviders = new Set<string>();
  const allCandidates = [...attemptsForMode(currentMode), ...fallbackAttempts()];

  // Prefer models that aren't on a rate-limit cooldown; if every candidate is
  // cooling down, fall back to trying them all anyway so we never hard-stop.
  const now = Date.now();
  const fresh = allCandidates.filter((candidate) => (rateLimitedUntil.get(candidate.model) ?? 0) <= now);
  const candidates = fresh.length ? fresh : allCandidates;

  for (const candidate of candidates) {
    if (blockedProviders.has(candidate.providerName)) continue;
    const at = new Date().toISOString();
    try {
      const message = await candidate.provider.complete(request);
      if (!message.trim()) throw new Error(`${candidate.providerName} returned an empty response.`);
      attempts.push({ provider: candidate.providerName, model: candidate.model, status: "ok", at });
      recordSuccess(request, message, candidate.providerName, candidate.model, attempts);
      return { message, fallback: false, provider: candidate.providerName, model: candidate.model, attempts };
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI provider unavailable";
      attempts.push({ provider: candidate.providerName, model: candidate.model, status: "failed", message, at });
      logger.warn("AI provider attempt failed", { provider: candidate.providerName, model: candidate.model, message });
      if (error instanceof Error && canSkipProvider(error)) blockedProviders.add(candidate.providerName);
      // Rate-limited free model → cool it down so we cycle to the next one.
      if (error instanceof Error && isRateLimited(error)) {
        rateLimitedUntil.set(candidate.model, Date.now() + RATE_LIMIT_COOLDOWN_MS);
      }
    }
  }

  const message = attempts.at(-1)?.message ?? "AI unavailable";
  recordFailure(message, attempts);
  logger.error("AI routing failed", message, { attempts });
  throw new Error(message);
}

export async function* routeAiStream(request: AiRequest): AsyncGenerator<string> {
  const result = await routeAiComplete(request);
  yield result.message;
}
