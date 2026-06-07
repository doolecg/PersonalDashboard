import { useEffect, useState } from "react";
import { Server } from "lucide-react";
import { getServerConfig, updateServerConfig, type ServerConfig } from "@/app/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LocalAiSettings() {
  const [config, setConfig] = useState<ServerConfig>({ localAiBaseUrl: "", localAiModel: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getServerConfig().then(setConfig).catch(() => undefined);
  }, []);

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

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/40 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-foreground">
          <Server className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Local AI server</p>
          <p className="text-xs text-muted-foreground">
            OpenAI-compatible URL (LM Studio, Ollama, llama.cpp). Pick “Local” as the provider above to use it.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-foreground">Server URL</label>
        <Input
          value={config.localAiBaseUrl}
          placeholder="http://127.0.0.1:1234"
          onChange={(event) => {
            setSaved(false);
            setConfig((current) => ({ ...current, localAiBaseUrl: event.target.value }));
          }}
          aria-label="Local AI server URL"
        />
        <p className="text-[11px] text-muted-foreground">“/v1” is added automatically if you leave it off.</p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-foreground">Model name</label>
        <Input
          value={config.localAiModel}
          placeholder="local-model"
          onChange={(event) => {
            setSaved(false);
            setConfig((current) => ({ ...current, localAiModel: event.target.value }));
          }}
          aria-label="Local AI model name"
        />
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
