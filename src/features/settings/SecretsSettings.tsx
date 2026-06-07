import { useEffect, useState } from "react";
import { KeyRound, Link2 } from "lucide-react";
import {
  disconnectGoogle,
  getGoogleStatus,
  getSecrets,
  updateSecrets,
  type GoogleStatus,
  type SecretsStatus,
} from "@/app/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const aiKeyFields = [
  { field: "openRouterApiKey", label: "OpenRouter API key", hint: "Free models — recommended." },
  { field: "openAiApiKey", label: "OpenAI API key", hint: "Optional." },
  { field: "geminiApiKey", label: "Google Gemini API key", hint: "Optional." },
] as const;

const googleCredFields = [
  { field: "googleClientId", label: "Google client ID" },
  { field: "googleClientSecret", label: "Google client secret" },
] as const;

export function SecretsSettings() {
  const [secrets, setSecrets] = useState<SecretsStatus>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [google, setGoogle] = useState<GoogleStatus | null>(null);

  function refreshGoogle() {
    getGoogleStatus().then(setGoogle).catch(() => setGoogle(null));
  }

  useEffect(() => {
    getSecrets().then(setSecrets).catch(() => undefined);
    refreshGoogle();
  }, []);

  function placeholder(field: string) {
    return secrets[field]?.set ? `Saved (${secrets[field].preview})` : "Not set";
  }

  async function save() {
    const patch = Object.fromEntries(Object.entries(drafts).filter(([, value]) => value.length > 0));
    if (!Object.keys(patch).length) return;
    setSaving(true);
    setSaved(false);
    try {
      setSecrets(await updateSecrets(patch));
      setDrafts({});
      setSaved(true);
      refreshGoogle();
    } catch {
      // leave drafts in place so the user can retry
    } finally {
      setSaving(false);
    }
  }

  function field(name: string, label: string, hint?: string) {
    return (
      <div className="flex flex-col gap-1" key={name}>
        <label className="text-xs font-medium text-foreground">
          {label}
          {hint ? <span className="ml-2 text-muted-foreground">{hint}</span> : null}
        </label>
        <Input
          type="password"
          autoComplete="off"
          value={drafts[name] ?? ""}
          placeholder={placeholder(name)}
          onChange={(event) => {
            setSaved(false);
            setDrafts((current) => ({ ...current, [name]: event.target.value }));
          }}
          aria-label={label}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/40 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-foreground">
          <KeyRound className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">API keys & integrations</p>
          <p className="text-xs text-muted-foreground">Stored on the server, layered over .env. Shown masked, like passwords.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">{aiKeyFields.map((entry) => field(entry.field, entry.label, entry.hint))}</div>

      <div className="h-px bg-border/60" />

      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Google Calendar</p>
        {googleCredFields.map((entry) => field(entry.field, entry.label))}

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {google?.connected
              ? "Connected — events sync to your calendar cards."
              : google?.configured
                ? "Credentials saved. Connect your account to sync."
                : "Add the client ID and secret above, then Save."}
          </p>
          {google?.connected ? (
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => disconnectGoogle().then(refreshGoogle)}
            >
              Disconnect
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              type="button"
              disabled={!google?.configured}
              onClick={() => {
                window.open("/api/google/auth", "_blank", "noopener");
                // Give the popup time to complete, then re-check.
                window.setTimeout(refreshGoogle, 4000);
              }}
            >
              <Link2 className="h-3.5 w-3.5" />
              Connect
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved ? <span className="text-xs text-emerald-300">Saved</span> : null}
        <Button size="sm" type="button" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save keys"}
        </Button>
      </div>
    </div>
  );
}
