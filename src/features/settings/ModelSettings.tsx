import { useEffect, useState } from "react";
import { Cpu } from "lucide-react";
import { getAiStatus, setAiSelection } from "@/app/apiClient";
import type { AiRoutingMode, AiUsageSnapshot } from "@/types/models";

const providerLabels: Record<AiRoutingMode, string> = {
  auto: "Auto (smart failover)",
  openrouter: "OpenRouter",
  openai: "OpenAI",
  gemini: "Google Gemini",
  local: "Local (Ollama / llama.cpp)",
};

const selectClass =
  "w-56 rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50";

function modelsForMode(status: AiUsageSnapshot, mode: AiRoutingMode): string[] {
  if (mode === "openrouter" || mode === "auto") return status.providerModels.openrouter ?? status.openRouterModels ?? [];
  return status.providerModels[mode] ?? [];
}

export function ModelSettings() {
  const [status, setStatus] = useState<AiUsageSnapshot | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getAiStatus().then(setStatus).catch(() => setStatus(null));
  }, []);

  async function apply(selection: { mode?: AiRoutingMode; model?: string | null }) {
    setBusy(true);
    try {
      setStatus(await setAiSelection(selection));
    } catch {
      // keep previous status on failure
    } finally {
      setBusy(false);
    }
  }

  if (!status) {
    return (
      <div className="rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-xs text-muted-foreground">
        Loading AI status…
      </div>
    );
  }

  const models = modelsForMode(status, status.mode);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/40 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-foreground">
          <Cpu className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">AI model</p>
          <p className="text-xs text-muted-foreground">
            Active: {status.activeProvider === "none" ? "—" : `${status.activeProvider} · ${status.activeModel}`}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-foreground">Provider</span>
        <select
          className={selectClass}
          value={status.mode}
          disabled={busy}
          onChange={(event) => apply({ mode: event.target.value as AiRoutingMode, model: null })}
          aria-label="AI provider"
        >
          {status.availableModes.map((mode) => (
            <option key={mode} value={mode}>
              {providerLabels[mode]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-foreground">Model</span>
        <select
          className={selectClass}
          value={status.selectedModel ?? ""}
          disabled={busy || models.length === 0}
          onChange={(event) => apply({ model: event.target.value || null })}
          aria-label="AI model"
        >
          <option value="">{status.mode === "auto" ? "Auto — best available" : "Default for provider"}</option>
          {models.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>

      {status.lastError ? <p className="text-xs text-destructive">Last error: {status.lastError}</p> : null}
    </div>
  );
}
