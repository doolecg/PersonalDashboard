type LogLevel = "info" | "warn" | "error";
type LogMeta = Record<string, unknown>;

export type LogEntry = { time: string; level: LogLevel; message: string };

const LOG_BUFFER_MAX = 120;
const logBuffer: LogEntry[] = [];

export function getRecentLogs(): LogEntry[] {
  return [...logBuffer];
}

// Computed once at startup; process.env doesn't change after boot.
const _cachedSensitiveValues: string[] = Object.entries(process.env)
  .filter(([key, val]) => val && /API_KEY|TOKEN|SECRET|PASSWORD|AUTH/i.test(key))
  .map(([, val]) => val as string)
  .filter((val) => val.length > 6);

function scrub(input: string) {
  let output = input.replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]");
  output = output.replace(/([?&](?:key|api_key|token)=)[^&\s]+/gi, "$1[redacted]");
  for (const value of _cachedSensitiveValues) output = output.split(value).join("[redacted]");
  return output;
}

function serialize(value: unknown) {
  try {
    return scrub(JSON.stringify(value));
  } catch {
    return scrub(String(value));
  }
}

export function formatError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: scrub(error.message),
      stack: error.stack ? scrub(error.stack) : undefined
    };
  }
  return { message: serialize(error) };
}

function write(level: LogLevel, message: string, meta?: LogMeta) {
  const time = new Date().toISOString();
  const clean = scrub(message);
  const entry: LogEntry = { time, level, message: clean };
  logBuffer.push(entry);
  if (logBuffer.length > LOG_BUFFER_MAX) logBuffer.shift();

  const line = { time, level, message: clean, ...(meta ? { meta } : {}) };
  const output = serialize(line);
  if (level === "error") console.error(output);
  else if (level === "warn") console.warn(output);
  else console.log(output);
}

export const logger = {
  info(message: string, meta?: LogMeta) {
    write("info", message, meta);
  },
  warn(message: string, meta?: LogMeta) {
    write("warn", message, meta);
  },
  error(message: string, error?: unknown, meta?: LogMeta) {
    write("error", message, { ...(meta ?? {}), error: formatError(error) });
  }
};
