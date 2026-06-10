import { getAccessToken, handleSessionExpired } from "./auth/authStore";

// Single fetch wrapper for all private /api calls: attaches the Supabase
// access token and flips the app into the locked state when the session is
// rejected. Never retries — the auth store decides what happens next.
export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers(init.headers);
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(input, { ...init, headers });
  if (response.status === 401) handleSessionExpired();
  return response;
}
