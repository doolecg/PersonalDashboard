import type { ShellConfig } from "./types";

export async function getShellConfig(): Promise<ShellConfig> {
  const response = await fetch("/api/shell");
  if (!response.ok) throw new Error(`Shell config failed with ${response.status}`);
  return response.json() as Promise<ShellConfig>;
}

export async function getHealthStatus(): Promise<boolean> {
  const response = await fetch("/api/healthz");
  return response.ok;
}
