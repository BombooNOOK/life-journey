import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import { normalizeEmail } from "@/lib/auth/viewer";
import {
  LJ_SESSION_COOKIE_NAME,
  LJ_SESSION_EXPIRES_IN_MS,
  LJ_SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/verifiedSessionConstants";
import { getFirebaseAdminAuth, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

export type VerifiedViewerSession = {
  uid: string;
  email: string;
  emailVerified?: boolean;
};

export type VerifiedIdTokenClaims = {
  uid: string;
  email: string;
  emailVerified?: boolean;
};

export function extractBearerToken(authorizationHeader: string | null | undefined): string | null {
  if (!authorizationHeader) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(authorizationHeader.trim());
  if (!match?.[1]) return null;
  return match[1];
}

/**
 * Cookie options for lj_session.
 * HttpOnly always. Secure in production. SameSite=Lax. Path=/.
 */
export function buildLjSessionCookieOptions(
  maxAgeSeconds: number = LJ_SESSION_MAX_AGE_SECONDS,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function buildLjSessionClearCookieOptions(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: 0;
} {
  return {
    ...buildLjSessionCookieOptions(0, env),
    maxAge: 0,
  };
}

/**
 * Verify Firebase ID token and require an email claim (fail-closed).
 * Does not trust client-supplied email/uid.
 */
export async function verifyIdTokenClaims(idToken: string): Promise<VerifiedIdTokenClaims> {
  if (!isFirebaseAdminConfigured()) {
    throw new VerifiedSessionError("firebase_admin_not_configured", 503);
  }
  if (!idToken) {
    throw new VerifiedSessionError("id_token_required", 401);
  }

  let decoded: {
    uid?: string;
    email?: string;
    email_verified?: boolean;
  };
  try {
    decoded = await getFirebaseAdminAuth().verifyIdToken(idToken);
  } catch {
    // Do not log token material.
    throw new VerifiedSessionError("invalid_id_token", 401);
  }

  const uid = typeof decoded.uid === "string" ? decoded.uid : "";
  if (!uid) {
    throw new VerifiedSessionError("id_token_uid_missing", 401);
  }

  const rawEmail = typeof decoded.email === "string" ? decoded.email : "";
  const email = normalizeEmail(rawEmail);
  if (!email) {
    throw new VerifiedSessionError("id_token_email_required", 401);
  }

  const session: VerifiedIdTokenClaims = { uid, email };
  if (typeof decoded.email_verified === "boolean") {
    session.emailVerified = decoded.email_verified;
  }
  return session;
}

/**
 * Create Firebase session cookie from a verified ID token.
 * expiresIn is the explicit constant LJ_SESSION_EXPIRES_IN_MS (5 days).
 */
export async function createVerifiedSessionCookie(idToken: string): Promise<{
  sessionCookie: string;
  expiresInMs: number;
  claims: VerifiedIdTokenClaims;
}> {
  const claims = await verifyIdTokenClaims(idToken);
  if (!isFirebaseAdminConfigured()) {
    throw new VerifiedSessionError("firebase_admin_not_configured", 503);
  }

  let sessionCookie: string;
  try {
    sessionCookie = await getFirebaseAdminAuth().createSessionCookie(idToken, {
      expiresIn: LJ_SESSION_EXPIRES_IN_MS,
    });
  } catch {
    throw new VerifiedSessionError("session_cookie_create_failed", 401);
  }

  if (!sessionCookie) {
    throw new VerifiedSessionError("session_cookie_create_failed", 401);
  }

  return {
    sessionCookie,
    expiresInMs: LJ_SESSION_EXPIRES_IN_MS,
    claims,
  };
}

/**
 * Authoritative viewer from Firebase session cookie only.
 * Does NOT fall back to legacy lj_user_email.
 */
export async function getVerifiedViewerSession(): Promise<VerifiedViewerSession | null> {
  const store = await cookies();
  const sessionCookie = store.get(LJ_SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  if (!isFirebaseAdminConfigured()) {
    return null;
  }

  try {
    // checkRevoked=false: normal logout clears cookie only; revocation is later (account delete).
    const decoded = await getFirebaseAdminAuth().verifySessionCookie(sessionCookie, false);
    const uid = typeof decoded.uid === "string" ? decoded.uid : "";
    if (!uid) return null;

    const email = normalizeEmail(typeof decoded.email === "string" ? decoded.email : "");
    if (!email) return null;

    const session: VerifiedViewerSession = { uid, email };
    if (typeof decoded.email_verified === "boolean") {
      session.emailVerified = decoded.email_verified;
    }
    return session;
  } catch {
    return null;
  }
}

export function applyLjSessionCookie(res: NextResponse, sessionCookie: string): void {
  res.cookies.set(LJ_SESSION_COOKIE_NAME, sessionCookie, buildLjSessionCookieOptions());
}

export function clearLjSessionCookie(res: NextResponse): void {
  res.cookies.set(LJ_SESSION_COOKIE_NAME, "", buildLjSessionClearCookieOptions());
}

export class VerifiedSessionError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status: number) {
    super(code);
    this.name = "VerifiedSessionError";
    this.code = code;
    this.status = status;
  }
}
