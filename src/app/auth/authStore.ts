import { getSupabase } from "./supabaseClient";

// Module-level auth store (same pattern as preferences/weather): a single
// source of truth consumed via useSyncExternalStore. The app shell renders
// nothing private until the phase settles, so no data flashes before auth.

export type AuthPhase =
  | "checking"
  | "disabled" // server says auth is not required (local development)
  | "signed-out"
  | "signing-in"
  | "signed-in"
  | "unauthorized" // valid account, not in the allowed-email list
  | "unverified" // email verification required
  | "unavailable"; // Supabase not configured/reachable

export type AuthState = {
  phase: AuthPhase;
  email: string;
  userId: string;
  /** Short status line for the login screen, e.g. "Checking session…". */
  statusMessage: string;
};

let state: AuthState = { phase: "checking", email: "", userId: "", statusMessage: "Checking session…" };
let accessToken: string | null = null;
let initialized = false;

const listeners = new Set<() => void>();

function setState(next: Partial<AuthState>) {
  state = { ...state, ...next };
  for (const listener of listeners) listener();
}

export function getAuthState(): AuthState {
  return state;
}

export function subscribeAuth(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAccessToken(): string | null {
  return accessToken;
}

type AuthConfig = { authRequired: boolean; supabaseConfigured: boolean };

async function fetchAuthConfig(): Promise<AuthConfig | null> {
  try {
    const response = await fetch("/api/auth/config");
    if (!response.ok) return null;
    return (await response.json()) as AuthConfig;
  } catch {
    return null;
  }
}

// Validate the Supabase session against the backend (allowed emails, email
// verification) and settle the final phase.
async function validateWithServer(token: string): Promise<void> {
  try {
    const response = await fetch("/api/auth/status", { headers: { Authorization: `Bearer ${token}` } });
    if (response.ok) {
      const payload = (await response.json()) as { email?: string; userId?: string };
      accessToken = token;
      setState({
        phase: "signed-in",
        email: payload.email ?? "",
        userId: payload.userId ?? "",
        statusMessage: "Access granted"
      });
      return;
    }
    const payload = (await response.json().catch(() => ({}))) as { message?: string };
    const message = payload.message ?? "Access denied";
    accessToken = null;
    if (response.status === 403 && /verify/i.test(message)) {
      setState({ phase: "unverified", statusMessage: message });
    } else if (response.status === 403) {
      setState({ phase: "unauthorized", statusMessage: message });
    } else {
      setState({ phase: "signed-out", email: "", userId: "", statusMessage: "Awaiting credentials" });
    }
  } catch {
    accessToken = null;
    setState({ phase: "unavailable", statusMessage: "Aura server unreachable" });
  }
}

export async function initAuth(): Promise<void> {
  if (initialized) return;
  initialized = true;

  const config = await fetchAuthConfig();
  if (config && !config.authRequired) {
    setState({ phase: "disabled", statusMessage: "Local development mode" });
    return;
  }

  const supabase = getSupabase();
  if (!supabase) {
    setState({
      phase: "unavailable",
      statusMessage: config
        ? "Supabase auth unavailable — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
        : "Aura server unreachable"
    });
    return;
  }

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "TOKEN_REFRESHED" && session?.access_token) {
      accessToken = session.access_token;
    }
    if (event === "SIGNED_OUT") {
      accessToken = null;
      setState({ phase: "signed-out", email: "", userId: "", statusMessage: "Awaiting credentials" });
    }
  });

  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    await validateWithServer(data.session.access_token);
  } else {
    setState({ phase: "signed-out", statusMessage: "Awaiting credentials" });
  }
}

export async function signIn(email: string, password: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    setState({ phase: "unavailable", statusMessage: "Supabase auth unavailable" });
    return;
  }
  setState({ phase: "signing-in", statusMessage: "Signing in…" });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    const message = error?.message ?? "Sign-in failed";
    setState({
      phase: "signed-out",
      statusMessage: /confirm|verif/i.test(message) ? "Email verification required" : "Access denied — " + message
    });
    return;
  }
  await validateWithServer(data.session.access_token);
}

export async function signOut(): Promise<void> {
  accessToken = null;
  setState({ phase: "signed-out", email: "", userId: "", statusMessage: "Awaiting credentials" });
  try {
    await getSupabase()?.auth.signOut();
  } catch {
    // Local session is already cleared; a network failure here is harmless.
  }
}

/** Called by apiFetch when a private route answers 401 — the session expired. */
export function handleSessionExpired(): void {
  if (state.phase !== "signed-in") return;
  accessToken = null;
  setState({ phase: "signed-out", email: "", userId: "", statusMessage: "Session expired — sign in again" });
}
