import { useState, type FormEvent } from "react";
import { signIn, signOut } from "./authStore";
import { useAuth } from "./useAuth";
import "./auth.css";

// AURA ACCESS — the secure gateway to the dashboard. Dark CRT panel, calm
// status line, minimal fields. Renders all signed-out phases: credentials,
// unauthorized account, unverified email, and auth-unavailable.
export function LoginScreen() {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const busy = auth.phase === "signing-in";
  const blocked = auth.phase === "unauthorized" || auth.phase === "unverified";
  const unavailable = auth.phase === "unavailable";

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (busy || !email.trim() || !password) return;
    void signIn(email.trim(), password);
  };

  return (
    <div className="aura-login">
      <div className="aura-login-panel" role="dialog" aria-labelledby="aura-login-title">
        <div className="aura-login-tag">
          <span>AUTH.GATEWAY</span>
          <span className={`aura-led ${unavailable ? "aura-led-amber" : blocked ? "aura-led-red" : "aura-led-green"}`} aria-hidden />
        </div>
        <h1 id="aura-login-title" className="aura-login-title">
          AURA ACCESS
        </h1>
        <p className="aura-login-subtitle">Authenticate to continue.</p>

        {blocked ? (
          <div className="aura-login-blocked">
            <p>{auth.statusMessage}</p>
            <button type="button" className="aura-btn" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        ) : unavailable ? (
          <div className="aura-login-blocked">
            <p>{auth.statusMessage}</p>
            <p className="aura-login-hint">Check the server configuration and reload.</p>
          </div>
        ) : (
          <form className="aura-login-form" onSubmit={onSubmit}>
            <label className="aura-field">
              <span>Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={busy}
                required
              />
            </label>
            <label className="aura-field">
              <span>Password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={busy}
                required
              />
            </label>
            <button type="submit" className="aura-btn aura-btn-primary" disabled={busy}>
              {busy ? "Signing in…" : "Authenticate"}
            </button>
          </form>
        )}

        <p className="aura-login-status" role="status" aria-live="polite">
          {auth.statusMessage}
        </p>
      </div>
    </div>
  );
}
