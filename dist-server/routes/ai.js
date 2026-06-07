import { Router } from "express";
import { runAssistant } from "../ai/assistant.js";
import { generateLifeSummary } from "../ai/lifeSummary.js";
import { getNewsSummary } from "../ai/newsSummary.js";
import { redactContextForPrompt } from "../ai/redactContext.js";
import { env } from "../env.js";
import { logger } from "../logger.js";
import { messagesFromPrompt } from "../providers/aiProvider.js";
import { getAiStatus, isAiRoutingMode, routeAiComplete, routeAiStream, setAiSelection } from "../providers/aiRuntime.js";
export const aiRouter = Router();
function requestFromBody(body, fallbackPrompt) {
    const value = body;
    const context = value.context;
    const prompt = value.prompt ?? fallbackPrompt;
    return {
        messages: value.messages?.length ? value.messages : messagesFromPrompt(prompt),
        context,
        maxTokens: value.maxTokens ?? 700
    };
}
function withRedactedContext(request) {
    if (!request.context)
        return request;
    const contextText = redactContextForPrompt(request.context, env.aiMaxContextChars);
    return {
        ...request,
        messages: [
            request.messages[0],
            { role: "system", content: `Dashboard context: ${contextText}` },
            ...request.messages.slice(1)
        ]
    };
}
async function completeWithFallback(request) {
    return routeAiComplete(withRedactedContext(request));
}
function writeSse(res, event, data) {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
}
aiRouter.post("/stream", async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    try {
        const request = requestFromBody(req.body, "Answer concisely from the supplied Aura context.");
        for await (const token of routeAiStream(withRedactedContext(request)))
            writeSse(res, "token", { token });
        writeSse(res, "done", getAiStatus());
    }
    catch (error) {
        logger.error("AI stream route failed", error, { route: "/api/ai/stream" });
        writeSse(res, "error", { message: error instanceof Error ? error.message : "AI unavailable" });
    }
    finally {
        res.end();
    }
});
aiRouter.get("/status", (_req, res) => {
    res.json(getAiStatus());
});
aiRouter.get("/news-summary", async (_req, res) => {
    try {
        res.json(await getNewsSummary());
    }
    catch (error) {
        logger.error("AI news summary failed", error, { route: "/api/ai/news-summary" });
        res.status(503).json({ message: error instanceof Error ? error.message : "News summary unavailable" });
    }
});
aiRouter.post("/life-summary", async (req, res) => {
    try {
        const body = req.body;
        const events = Array.isArray(body.events) ? body.events : [];
        res.json(await generateLifeSummary(events, typeof body.weather === "string" ? body.weather : undefined));
    }
    catch (error) {
        logger.error("AI life summary failed", error, { route: "/api/ai/life-summary" });
        res.status(503).json({ message: error instanceof Error ? error.message : "Life summary unavailable" });
    }
});
aiRouter.patch("/status", (req, res) => {
    const body = (req.body ?? {});
    const hasMode = body.mode !== undefined;
    const hasModel = body.model !== undefined;
    if (hasMode && !isAiRoutingMode(body.mode)) {
        return res.status(400).json({ message: "Invalid AI routing mode." });
    }
    if (hasModel && body.model !== null && typeof body.model !== "string") {
        return res.status(400).json({ message: "Invalid model." });
    }
    setAiSelection({
        mode: hasMode ? body.mode : undefined,
        model: hasModel ? body.model : undefined
    });
    res.json(getAiStatus());
});
const assistantRoles = new Set(["system", "user", "assistant"]);
function assistantMessagesFromBody(body) {
    const value = body;
    if (!Array.isArray(value.messages))
        return [];
    return value.messages
        .filter((message) => assistantRoles.has(message.role ?? "") && typeof message.content === "string")
        .map((message) => ({ role: message.role, content: message.content }));
}
aiRouter.post("/assistant", async (req, res) => {
    const messages = assistantMessagesFromBody(req.body);
    if (!messages.length)
        return res.status(400).json({ message: "At least one message is required." });
    const context = req.body?.context;
    const contextText = context ? redactContextForPrompt(context, env.aiMaxContextChars) : undefined;
    try {
        res.json(await runAssistant(messages, contextText));
    }
    catch (error) {
        logger.error("AI assistant route failed", error, { route: "/api/ai/assistant" });
        res.status(503).json({ message: error instanceof Error ? error.message : "Assistant unavailable" });
    }
});
aiRouter.post("/chat", async (req, res) => {
    const request = requestFromBody(req.body, "Answer concisely from the supplied Aura context.");
    try {
        res.json(await completeWithFallback(request));
    }
    catch (error) {
        logger.error("AI chat route failed", error, { route: "/api/ai/chat" });
        res.status(503).json({ message: error instanceof Error ? error.message : "AI unavailable" });
    }
});
