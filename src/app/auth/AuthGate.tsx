import { useEffect, type ReactNode } from "react";
import { initAuth } from "./authStore";
import { useAuth } from "./useAuth";
import { LoginScreen } from "./LoginScreen";
import "./auth.css";

// Gates the entire app: nothing private renders until the session check
// settles, so there is no flash of dashboard data before auth.
export function AuthGate({ children }: { children: ReactNode }) {
  const auth = useAuth();

  useEffect(() => {
    void initAuth();
  }, []);

  if (auth.phase === "checking") {
    return (
      <div className="aura-login">
        <div className="aura-login-checking" role="status" aria-live="polite">
          <span className="aura-led aura-led-amber" aria-hidden />
          Checking session…
        </div>
      </div>
    );
  }

  if (auth.phase === "signed-in" || auth.phase === "disabled") {
    return <>{children}</>;
  }

  return <LoginScreen />;
}
