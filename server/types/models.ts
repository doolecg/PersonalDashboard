export type AuraContext = Record<string, unknown> & {
  messages?: Array<{ name?: string; preview?: string; unread?: boolean; needsReply?: boolean }>;
  name?: string;
};

export type AiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AiRequest = {
  messages: AiMessage[];
  context?: Partial<AuraContext>;
  maxTokens?: number;
};

export type AiRoutingMode = "auto" | "openrouter" | "gemini" | "openai" | "local";

export type AiRouteAttempt = {
  provider: string;
  model: string;
  status: "ok" | "failed";
  message?: string;
  at: string;
};

export type AiUsageSnapshot = {
  mode: AiRoutingMode;
  activeProvider: string;
  activeModel: string;
  requests: number;
  failures: number;
  estimatedPromptTokens: number;
  estimatedCompletionTokens: number;
  estimatedTotalTokens: number;
  lastError?: string;
  lastAttempts: AiRouteAttempt[];
  availableModes: AiRoutingMode[];
  openRouterModels: string[];
  updatedAt: string;
};
