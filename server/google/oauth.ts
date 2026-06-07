import { env } from "../env.js";
import { deleteObject, readObject, writeObject } from "../store/collectionStore.js";

const tokenStore = "google-tokens";
const scopes = ["https://www.googleapis.com/auth/calendar.readonly"];

export type GoogleTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
};

export function isGoogleConfigured() {
  return Boolean(env.googleClientId && env.googleClientSecret && env.googleRedirectUri);
}

export function buildAuthUrl(state: string) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", env.googleClientId);
  url.searchParams.set("redirect_uri", env.googleRedirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scopes.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  return url.toString();
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

async function tokenRequest(params: Record<string, string>): Promise<GoogleTokens> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString()
  });
  const data = (await response.json()) as TokenResponse;
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Google token request failed");
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000
  };
}

export async function exchangeCode(code: string): Promise<void> {
  const tokens = await tokenRequest({
    code,
    client_id: env.googleClientId,
    client_secret: env.googleClientSecret,
    redirect_uri: env.googleRedirectUri,
    grant_type: "authorization_code"
  });
  await writeObject(tokenStore, tokens);
}

export async function getStoredTokens() {
  return readObject<GoogleTokens>(tokenStore);
}

export async function clearTokens() {
  await deleteObject(tokenStore);
}

export async function isConnected() {
  return Boolean(await getStoredTokens());
}

// Returns a valid access token, refreshing it if it has (nearly) expired.
export async function getAccessToken(): Promise<string | null> {
  const tokens = await getStoredTokens();
  if (!tokens) return null;
  if (Date.now() < tokens.expiresAt - 60_000) return tokens.accessToken;
  if (!tokens.refreshToken) return null;

  const refreshed = await tokenRequest({
    refresh_token: tokens.refreshToken,
    client_id: env.googleClientId,
    client_secret: env.googleClientSecret,
    grant_type: "refresh_token"
  });
  const merged: GoogleTokens = { ...refreshed, refreshToken: refreshed.refreshToken ?? tokens.refreshToken };
  await writeObject(tokenStore, merged);
  return merged.accessToken;
}
