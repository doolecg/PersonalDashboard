type LogLevel = "info" | "warn" | "error";
type LogMeta = Record<string, unknown>;

export type LogEntry = { time: string; level: LogLevel; message: string; source?: string; count?: number };

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

function write(level: LogLevel, message: string, meta?: LogMeta, source?: string) {
  const time = new Date().toISOString();
  const clean = scrub(message);
  const entry: LogEntry = { time, level, message: clean, ...(source ? { source } : {}) };
  logBuffer.push(entry);
  if (logBuffer.length > LOG_BUFFER_MAX) logBuffer.shift();

  const line = { time, level, message: clean, ...(source ? { source } : {}), ...(meta ? { meta } : {}) };
  const output = serialize(line);
  if (level === "error") console.error(output);
  else if (level === "warn") console.warn(output);
  else console.log(output);
}

// Deduped logging: a given key logs at most once per window; repeats are counted
// on the buffered entry and summarized when the window reopens. Keeps missing
// API keys / unreachable providers from spamming the console and log buffer.
const DEDUPE_WINDOW_MS = 10 * 60 * 1000;
type DedupeState = { until: number; suppressed: number; entry: LogEntry };
const dedupeMap = new Map<string, DedupeState>();

function writeDeduped(key: string, level: LogLevel, message: string, meta?: LogMeta, source?: string) {
  const now = Date.now();
  const state = dedupeMap.get(key);
  if (state && state.until > now) {
    state.suppressed += 1;
    state.entry.count = state.suppressed + 1;
    return;
  }
  if (state && state.suppressed > 0) {
    write("info", `${message} (repeated ${state.suppressed} times, suppressed)`, undefined, source);
  }
  write(level, message, meta, source);
  const entry = logBuffer[logBuffer.length - 1];
  dedupeMap.set(key, { until: now + DEDUPE_WINDOW_MS, suppressed: 0, entry });
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
  },
  source(source: string) {
    return {
      info: (message: string, meta?: LogMeta) => write("info", message, meta, source),
      warn: (message: string, meta?: LogMeta) => write("warn", message, meta, source),
      error: (message: string, error?: unknown, meta?: LogMeta) =>
        write("error", message, { ...(meta ?? {}), error: formatError(error) }, source)
    };
  },
  dedupedInfo(key: string, message: string, meta?: LogMeta) {
    writeDeduped(key, "info", message, meta, key.split(":")[0]);
  },
  dedupedWarn(key: string, message: string, meta?: LogMeta) {
    writeDeduped(key, "warn", message, meta, key.split(":")[0]);
  },
  dedupedError(key: string, message: string, error?: unknown, meta?: LogMeta) {
    writeDeduped(key, "error", message, { ...(meta ?? {}), error: formatError(error) }, key.split(":")[0]);
  }
};
