import { Router } from "express";
import { env } from "../env.js";
import { isAuthRequired, requireAuth, getAuth } from "../auth/middleware.js";
import { isSupabaseAuthConfigured, isSupabaseConfigured } from "../supabase.js";
export const authRouter = Router();
// Public: tells the frontend whether auth is required and how. Never returns secrets —
// the browser gets its own Supabase URL/anon key from VITE_ build-time vars.
authRouter.get("/config", (_req, res) => {
    res.json({
        authRequired: isAuthRequired(),
        provider: env.authProvider,
        supabaseConfigured: isSupabaseAuthConfigured(),
        requireEmailVerification: env.authRequireEmailVerification
    });
});
// Private: identity + storage status for the signed-in user.
authRouter.get("/status", requireAuth, (req, res) => {
    const auth = getAuth(req);
    res.json({
        userId: auth.userId,
        email: auth.email,
        mode: auth.mode,
        authorized: true,
        allowedEmailsConfigured: env.authAllowedEmails.length > 0,
        storageDriver: auth.mode === "local" && !isSupabaseConfigured() ? "json" : env.storageDriver,
        supabaseStorageConfigured: isSupabaseConfigured()
    });
});
