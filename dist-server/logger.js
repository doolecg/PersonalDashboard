const sensitiveValues = () => Object.entries(process.env)
    .filter(([key, value]) => value && /API_KEY|TOKEN|SECRET|PASSWORD|AUTH/i.test(key))
    .map(([, value]) => value)
    .filter((value) => value.length > 6);
function scrub(input) {
    let output = input.replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]");
    output = output.replace(/([?&](?:key|api_key|token)=)[^&\s]+/gi, "$1[redacted]");
    for (const value of sensitiveValues())
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
function write(level, message, meta) {
    const line = {
        time: new Date().toISOString(),
        level,
        message: scrub(message),
        ...(meta ? { meta } : {})
    };
    const output = serialize(line);
    if (level === "error")
        console.error(output);
    else if (level === "warn")
        console.warn(output);
    else
        console.log(output);
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
    }
};
