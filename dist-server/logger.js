const LOG_BUFFER_MAX = 120;
const logBuffer = [];
export function getRecentLogs() {
    return [...logBuffer];
}
// Computed once at startup; process.env doesn't change after boot.
const _cachedSensitiveValues = Object.entries(process.env)
    .filter(([key, val]) => val && /API_KEY|TOKEN|SECRET|PASSWORD|AUTH/i.test(key))
    .map(([, val]) => val)
    .filter((val) => val.length > 6);
function scrub(input) {
    let output = input.replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]");
    output = output.replace(/([?&](?:key|api_key|token)=)[^&\s]+/gi, "$1[redacted]");
    for (const value of _cachedSensitiveValues)
        output = output.split(value).join("[redacted]");
    return output;
}
function serialize(value) {
    try {
        return scrub(JSON.stringify(value));
    }
    catch {
        return scrub(String(value));
    }
}
export function formatError(error) {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: scrub(error.message),
            stack: error.stack ? scrub(error.stack) : undefined
        };
    }
    return { message: serialize(error) };
}
function write(level, message, meta, source) {
    const time = new Date().toISOString();
    const clean = scrub(message);
    const entry = { time, level, message: clean, ...(source ? { source } : {}) };
    logBuffer.push(entry);
    if (logBuffer.length > LOG_BUFFER_MAX)
        logBuffer.shift();
    const line = { time, level, message: clean, ...(source ? { source } : {}), ...(meta ? { meta } : {}) };
    const output = serialize(line);
    if (level === "error")
        console.error(output);
    else if (level === "warn")
        console.warn(output);
    else
        console.log(output);
}
// Deduped logging: a given key logs at most once per window; repeats are counted
// on the buffered entry and summarized when the window reopens. Keeps missing
// API keys / unreachable providers from spamming the console and log buffer.
const DEDUPE_WINDOW_MS = 10 * 60 * 1000;
const dedupeMap = new Map();
function writeDeduped(key, level, message, meta, source) {
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
    info(message, meta) {
        write("info", message, meta);
    },
    warn(message, meta) {
        write("warn", message, meta);
    },
    error(message, error, meta) {
        write("error", message, { ...(meta ?? {}), error: formatError(error) });
    },
    source(source) {
        return {
            info: (message, meta) => write("info", message, meta, source),
            warn: (message, meta) => write("warn", message, meta, source),
            error: (message, error, meta) => write("error", message, { ...(meta ?? {}), error: formatError(error) }, source)
        };
    },
    dedupedInfo(key, message, meta) {
        writeDeduped(key, "info", message, meta, key.split(":")[0]);
    },
    dedupedWarn(key, message, meta) {
        writeDeduped(key, "warn", message, meta, key.split(":")[0]);
    },
    dedupedError(key, message, error, meta) {
        writeDeduped(key, "error", message, { ...(meta ?? {}), error: formatError(error) }, key.split(":")[0]);
    }
};
