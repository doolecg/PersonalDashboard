import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthGate } from "./app/auth/AuthGate";
import "./styles/global.css";

function reportClientError(kind: string, error: unknown, extra: Record<string, unknown> = {}) {
  const value = error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };
  const payload = JSON.stringify({
    kind,
    ...value,
    ...extra,
    path: `${window.location.origin}${window.location.pathname}`,
    userAgent: navigator.userAgent
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/log/client-error", new Blob([payload], { type: "application/json" }));
    return;
  }

  void fetch("/api/log/client-error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true
  }).catch(() => undefined);
}

window.addEventListener("error", (event) => {
  reportClientError("window.error", event.error ?? event.message, {
    filename: event.filename,
    line: event.lineno,
    column: event.colno
  });
});

window.addEventListener("unhandledrejection", (event) => {
  reportClientError("unhandledrejection", event.reason);
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthGate>
      <App />
    </AuthGate>
  </StrictMode>
);
