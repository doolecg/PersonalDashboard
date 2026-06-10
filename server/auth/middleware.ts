import type { NextFunction, Request, Response } from "express";
import { env } from "../env.js";
import { logger } from "../logger.js";
import { getSupabaseAuthClient } from "../supabase.js";

export type AuthContext = {
  userId: string;
  email: string;
  mode: "supabase" | "local";
};

declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthContext;
  }
}

// Fixed identity used when auth is disabled (development only).
export const LOCAL_USER: AuthContext = { userId: "local", email: "local@dev", mode: "local" };

/** Auth is enforced unless explicitly disabled — and never disabled in production. */
export function isAuthRequired(): boolean {
  if (env.nodeEnv === "production") return true;
  return env.authEnabled;
}

type CacheEntry = { auth: AuthContext; expires: number };
const tokenCache = new Map<string, CacheEntry>();
const TOKEN_CACHE_TTL_MS = 60_000;
const TOKEN_CACHE_MAX = 100;

function cacheToken(token: string, auth: AuthContext) {
  if (tokenCache.size >= TOKEN_CACHE_MAX) {
    const oldest = tokenCache.keys().next().value;
    if (oldest) tokenCache.delete(oldest);
  }
  tokenCache.set(token, { auth, expires: Date.now() + TOKEN_CACHE_TTL_MS });
}

export type VerifyResult =
  | { ok: true; auth: AuthContext; emailVerified: boolean }
  | { ok: false; status: 401 | 403 | 503; message: string };

export async function verifyAccessToken(token: string): Promise<VerifyResult> {
  const cached = tokenCache.get(token);
  if (cached && cached.expires > Date.now()) {
    return { ok: true, auth: cached.auth, emailVerified: true };
  }

  const client = getSupabaseAuthClient();
  if (!client) {
    return { ok: false, status: 503, message: "Supabase auth is not configured on the server." };
  }

  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    return { ok: false, status: 401, message: "Invalid or expired session." };
  }

  const email = (data.user.email ?? "").toLowerCase();
  if (env.authAllowedEmails.length > 0 && !env.authAllowedEmails.includes(email)) {
    return { ok: false, status: 403, message: "This account is not authorised for this dashboard." };
  }

  const emailVerified = Boolean(data.user.email_confirmed_at);
  if (env.authRequireEmailVerification && !emailVerified) {
    return { ok: false, status: 403, message: "Please verify your email before accessing Aura." };
  }

  const auth: AuthContext = { userId: data.user.id, email, mode: "supabase" };
  cacheToken(token, auth);
  return { ok: true, auth, emailVerified };
}

/** Express middleware protecting private /api routes. */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!isAuthRequired()) {
    req.auth = LOCAL_USER;
    return next();
  }

  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    const result = await verifyAccessToken(token);
    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }
    req.auth = result.auth;
    return next();
  } catch (error) {
    logger.dedupedError("auth:verify-failed", "Token verification failed", error);
    return res.status(503).json({ message: "Authentication service unavailable." });
  }
}

/** The auth context for a request; throws if the middleware did not run. */
export function getAuth(req: Request): AuthContext {
  if (!req.auth) throw new Error("Route is missing auth middleware");
  return req.auth;
}
