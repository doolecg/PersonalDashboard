import { useEffect, useState } from "react";
import { Server } from "lucide-react";
import {
  detectLocalModels,
  getServerConfig,
  updateServerConfig,
  type LocalAiProvider,
  type ServerConfig
} from "@/app/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const providerOptions: Array<{ id: LocalAiProvider; label: string; placeholder: string }> = [
  { id: "lmstudio", label: "LM Studio", placeholder: "http://127.0.0.1:1234" },
  { id: "ollama", label: "Ollama", placeholder: "http://127.0.0.1:11434" }
];

export function LocalAiSettings() {
  const [config, setConfig] = useState<ServerConfig>({ localAiProvider: "lmstudio", localAiBaseUrl: "", localAiModel: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState<string[] | null>(null);

  async function detect() {
    setDetecting(true);
    setDetected(null);
    try {
      const models = await detectLocalModels(config.localAiProvider, config.localAiBaseUrl);
      setDetected(models);
      // Auto-fill when exactly one model is loaded.
      if (models.length === 1) {
        setSaved(false);
        setConfig((current) => ({ ...current, localAiModel: models[0] }));
      }
    } catch {
      setDetected([]);
    } finally {
      setDetecting(false);
    }
  }

  useEffect(() => {
    getServerConfig().then(setConfig).catch(() => undefined);
  }, []);

  // Switching provider re-loads that provider's saved URL/model from the server.
  async function selectProvider(provider: LocalAiProvider) {
    if (provider === config.localAiProvider) return;
    setSaved(false);
    setConfig((current) => ({ ...current, localAiProvider: provider }));
    try {
      setConfig(await updateServerConfig({ localAiProvider: provider }));
    } catch {
      // keep current values on failure
    }
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      setConfig(await updateServerConfig(config));
      setSaved(true);
    } catch {
      // keep current values on failure
    } finally {
      setSaving(false);
    }
  }

  const active = providerOptions.find((option) => option.id === config.localAiProvider) ?? providerOptions[0];

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/40 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-foreground">
          <Server className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Local AI server</p>
          <p className="text-xs text-muted-foreground">
            Choose your running local backend and point it at its server. Pick “Local” as the provider above to use it.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 self-start rounded-2xl border border-border/60 bg-background/40 p-1">
        {providerOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={config.localAiProvider === option.id}
            onClick={() => void selectProvider(option.id)}
            className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
              config.localAiProvider === option.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-foreground">{active.label} server URL</label>
        <Input
          value={config.localAiBaseUrl}
          placeholder={active.placeholder}
          onChange={(event) => {
            setSaved(false);
            setConfig((current) => ({ ...current, localAiBaseUrl: event.target.value }));
          }}
          aria-label="Local AI server URL"
        />
        {config.localAiProvider === "lmstudio" ? (
          <p className="text-[11px] text-muted-foreground">“/v1” is added automatically if you leave it off.</p>
        ) : (
          <p className="text-[11px] text-muted-foreground">Ollama's default API port is 11434.</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-foreground">Model name</label>
          <Button size="sm" variant="ghost" type="button" onClick={() => void detect()} disabled={detecting}>
            {detecting ? "Detecting…" : "Detect from server"}
          </Button>
        </div>
        <Input
          value={config.localAiModel}
          placeholder="local-model"
          onChange={(event) => {
            setSaved(false);
            setConfig((current) => ({ ...current, localAiModel: event.target.value }));
          }}
          aria-label="Local AI model name"
        />
        {detected !== null ? (
          detected.length ? (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {detected.map((model) => (
                <button
                  key={model}
                  type="button"
                  onClick={() => {
                    setSaved(false);
                    setConfig((current) => ({ ...current, localAiModel: model }));
                  }}
                  className={`rounded-lg border px-2 py-1 text-[11px] transition ${
                    config.localAiModel === model
                      ? "border-primary bg-primary/20 text-foreground"
                      : "border-border/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {model}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-amber-300">No models found — is the server running at that URL?</p>
          )
        ) : null}
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved ? <span className="text-xs text-emerald-300">Saved</span> : null}
        <Button size="sm" type="button" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save local server"}
        </Button>
      </div>
    </div>
  );
}
