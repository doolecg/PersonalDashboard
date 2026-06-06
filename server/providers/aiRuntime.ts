import { createOpenAiProvider } from "../adapters/openAiProvider.js";
import { createOpenRouterProvider } from "../adapters/openRouterProvider.js";
import { createGeminiProvider } from "../adapters/geminiProvider.js";
import { llamaCppOpenAiProvider } from "../adapters/llamaCppOpenAiProvider.js";
import { ollamaProvider } from "../adapters/ollamaProvider.js";
import { env } from "../env.js";
import { logger } from "../logger.js";
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
  return [
    attempt("ollama", env.ollamaModel, ollamaProvider),
    attempt("openai-compatible", env.openAiCompatModel, llamaCppOpenAiProvider)
  ];
}

function attemptsForMode(mode: AiRoutingMode): Attempt[] {
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

function canSkipProvider(error: Error) {
  return /authentication failed|api_key is not configured/i.test(error.message);
}

function fallbackAttempts() {
  return [];
}

export function getAiStatus(): AiUsageSnapshot {
  return {
    mode: currentMode,
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
    updatedAt: usage.updatedAt
  };
}

export function setAiRoutingMode(mode: AiRoutingMode) {
  currentMode = mode;
  usage.updatedAt = new Date().toISOString();
}

export function isAiRoutingMode(value: unknown): value is AiRoutingMode {
  return typeof value === "string" && modes.includes(value as AiRoutingMode);
}

export async function routeAiComplete(request: AiRequest): Promise<RouteResult> {
  const attempts: AiRouteAttempt[] = [];
  const blockedProviders = new Set<string>();
  const candidates = [...attemptsForMode(currentMode), ...fallbackAttempts()];

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
