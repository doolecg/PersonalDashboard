import { env } from "./env.js";
import { readObject, writeObject } from "./store/collectionStore.js";

// Secrets the user can set at runtime from Settings. Each maps to a field on the
// `env` object; adapters read these lazily, so overriding them at runtime takes
// effect immediately. Values are persisted to data/secrets.json and layered over
// whatever is in .env (an empty value clears the override and reverts to .env).
export const secretFields = [
  "openRouterApiKey",
  "openAiApiKey",
  "geminiApiKey",
  "googleClientId",
  "googleClientSecret"
] as const;

export type SecretField = (typeof secretFields)[number];
type SecretOverrides = Partial<Record<SecretField, string>>;

const storeName = "secrets";

// Capture the .env defaults at load time, before any override is applied.
const envDefaults: Record<SecretField, string> = secretFields.reduce((acc, field) => {
  acc[field] = String((env as Record<string, unknown>)[field] ?? "");
  return acc;
}, {} as Record<SecretField, string>);

function setEnv(field: SecretField, value: string) {
  (env as Record<string, unknown>)[field] = value;
}

function mask(value: string): string {
  if (!value) return "";
  return value.length <= 4 ? "••••" : `••••${value.slice(-4)}`;
}

export async function applyStoredSecrets(): Promise<void> {
  const overrides = (await readObject<SecretOverrides>(storeName)) ?? {};
  for (const field of secretFields) {
    const value = overrides[field];
    if (typeof value === "string" && value) setEnv(field, value);
  }
}

export function getSecretsStatus(): Record<SecretField, { set: boolean; preview: string }> {
  return secretFields.reduce((acc, field) => {
    const value = String((env as Record<string, unknown>)[field] ?? "");
    acc[field] = { set: Boolean(value), preview: mask(value) };
    return acc;
  }, {} as Record<SecretField, { set: boolean; preview: string }>);
}

export async function updateSecrets(patch: SecretOverrides): Promise<void> {
  const overrides = (await readObject<SecretOverrides>(storeName)) ?? {};
  for (const field of secretFields) {
    if (!(field in patch)) continue;
    const raw = patch[field];
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (trimmed) {
      overrides[field] = trimmed;
      setEnv(field, trimmed);
    } else {
      delete overrides[field];
      setEnv(field, envDefaults[field]);
    }
  }
  await writeObject(storeName, overrides);
}
