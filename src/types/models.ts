export type NewsTickerItem = {
  source: string;
  title: string;
  url?: string;
  image?: string;
};

export type SystemStatus = {
  uptime: number;
  hostUptime: number;
  cpu: { usage: number; cores: number; model: string };
  memory: {
    used: number;
    total: number;
    percent: number;
  };
  disk:
    | {
        free: number;
        total: number;
        percent: number;
      }
    | null;
  temp: number | null;
  gpu: { usage: number; memUsed: number | null; memTotal: number | null } | null;
};

export type AuraContext = Record<string, unknown> & {
  messages?: Array<{ name?: string; preview?: string; unread?: boolean; needsReply?: boolean }>;
  name?: string;
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
  selectedModel: string | null;
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
  providerModels: Partial<Record<AiRoutingMode, string[]>>;
  updatedAt: string;
};
