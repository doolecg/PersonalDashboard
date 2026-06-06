import { Router, type Response } from "express";
import { redactContextForPrompt } from "../ai/redactContext.js";
import { env } from "../env.js";
import { logger } from "../logger.js";
import { messagesFromPrompt } from "../providers/aiProvider.js";
import { getAiStatus, isAiRoutingMode, routeAiComplete, routeAiStream, setAiRoutingMode } from "../providers/aiRuntime.js";
import type { AiRequest, AuraContext } from "../types/models.js";

export const aiRouter = Router();

function requestFromBody(body: unknown, fallbackPrompt: string): AiRequest {
  const value = body as Partial<AiRequest> & { prompt?: string };
  const context = value.context as Partial<AuraContext> | undefined;
  const prompt = value.prompt ?? fallbackPrompt;
  return {
    messages: value.messages?.length ? value.messages : messagesFromPrompt(prompt),
    context,
    maxTokens: value.maxTokens ?? 700
  };
}

function withRedactedContext(request: AiRequest): AiRequest {
  if (!request.context) return request;
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

async function completeWithFallback(request: AiRequest) {
  return routeAiComplete(withRedactedContext(request));
}

function writeSse(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

aiRouter.post("/stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const request = requestFromBody(req.body, "Answer concisely from the supplied Aura context.");
    for await (const token of routeAiStream(withRedactedContext(request))) writeSse(res, "token", { token });
    writeSse(res, "done", getAiStatus());
  } catch (error) {
    logger.error("AI stream route failed", error, { route: "/api/ai/stream" });
    writeSse(res, "error", { message: error instanceof Error ? error.message : "AI unavailable" });
  } finally {
    res.end();
  }
});

aiRouter.get("/status", (_req, res) => {
  res.json(getAiStatus());
});

aiRouter.patch("/status", (req, res) => {
  const mode = req.body?.mode;
  if (!isAiRoutingMode(mode)) return res.status(400).json({ message: "Invalid AI routing mode." });
  setAiRoutingMode(mode);
  res.json(getAiStatus());
});

aiRouter.post("/chat", async (req, res) => {
  const request = requestFromBody(req.body, "Answer concisely from the supplied Aura context.");
  try {
    res.json(await completeWithFallback(request));
  } catch (error) {
    logger.error("AI chat route failed", error, { route: "/api/ai/chat" });
    res.status(503).json({ message: error instanceof Error ? error.message : "AI unavailable" });
  }
});
