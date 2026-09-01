/**
 * Firebase verified session cookie contract (AI-8.1a).
 *
 * Lifetime: Firebase createSessionCookie allows 5 minutes … 14 days.
 * Legacy lj_user_email Max-Age is 30 days, but Firebase cannot match that.
 * Choose 5 days — within Firebase limits, shorter stolen-session window than
 * the 14-day maximum, conservative vs long-lived client cookies.
 */

/** HttpOnly authoritative session cookie (Firebase session cookie value). */
export const LJ_SESSION_COOKIE_NAME = "lj_session" as const;

/**
 * Session cookie lifetime in milliseconds (passed to createSessionCookie).
 * 5 days = 5 * 24 * 60 * 60 * 1000
 */
export const LJ_SESSION_EXPIRES_IN_MS = 5 * 24 * 60 * 60 * 1000;

/** Max-Age for Set-Cookie (seconds), derived from expiresIn. */
export const LJ_SESSION_MAX_AGE_SECONDS = Math.floor(LJ_SESSION_EXPIRES_IN_MS / 1000);
