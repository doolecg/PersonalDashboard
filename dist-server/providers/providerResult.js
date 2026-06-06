import { logger } from "../logger.js";
export function providerResult(status, data, message, source = "provider") {
    if (status === "error")
        logger.error(`${source} provider failed`, message ?? "Provider unavailable");
    return { status, data, message, updatedAt: new Date().toISOString() };
}
