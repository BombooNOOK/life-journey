import { NextResponse } from "next/server";

import { isVerifiedAuthSessionEnabled } from "@/lib/auth/verifiedAuthSessionGate";
import {
  applyLjSessionCookie,
  clearLjSessionCookie,
  createVerifiedSessionCookie,
  extractBearerToken,
  getVerifiedViewerSession,
  VerifiedSessionError,
} from "@/lib/auth/verifiedSession";

/**
 * Verified Firebase session foundation (AI-8.1a).
 *
 * Parallel to legacy /api/auth/session — does not replace it.
 * Gate: LJD_VERIFIED_AUTH_SESSION_ENABLED=YES|1
 *
 * POST: Authorization: Bearer <Firebase ID token>
 *   → verifyIdToken → createSessionCookie → HttpOnly lj_session
 *   Body email/uid are ignored as identity sources.
 *
 * DELETE: clears lj_session only (does not revoke Firebase refresh tokens).
 *
 * GET: reports whether a verified session is present (no legacy cookie fallback).
 */

export const runtime = "nodejs";

export async function GET() {
  if (!isVerifiedAuthSessionEnabled()) {
    return NextResponse.json(
      { error: "Verified auth session is unavailable.", code: "VERIFIED_AUTH_DISABLED" },
      { status: 503 },
    );
  }

  const session = await getVerifiedViewerSession();
  if (!session) {
    return NextResponse.json({ code: "OK", authenticated: false });
  }
  return NextResponse.json({
    code: "OK",
    authenticated: true,
    uid: session.uid,
    email: session.email,
    ...(typeof session.emailVerified === "boolean"
      ? { emailVerified: session.emailVerified }
      : {}),
  });
}

export async function POST(req: Request) {
  if (!isVerifiedAuthSessionEnabled()) {
    return NextResponse.json(
      { error: "Verified auth session is unavailable.", code: "VERIFIED_AUTH_DISABLED" },
      { status: 503 },
    );
  }

  // Consume body if present, but never use email/uid from it for identity.
  if (req.headers.get("content-type")?.includes("application/json")) {
    try {
      await req.json();
    } catch {
      // Ignore malformed JSON body — identity is Bearer-only.
    }
  }

  const idToken = extractBearerToken(req.headers.get("authorization"));
  if (!idToken) {
    return NextResponse.json(
      { error: "Authorization Bearer token is required.", code: "MISSING_BEARER" },
      { status: 401 },
    );
  }

  try {
    const { sessionCookie, claims } = await createVerifiedSessionCookie(idToken);
    const res = NextResponse.json({
      code: "OK",
      uid: claims.uid,
      email: claims.email,
      ...(typeof claims.emailVerified === "boolean"
        ? { emailVerified: claims.emailVerified }
        : {}),
    });
    applyLjSessionCookie(res, sessionCookie);
    return res;
  } catch (error) {
    if (error instanceof VerifiedSessionError) {
      return NextResponse.json(
        { error: "Verified session creation failed.", code: error.code },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Verified session creation failed.", code: "SESSION_CREATE_FAILED" },
      { status: 401 },
    );
  }
}

export async function DELETE() {
  if (!isVerifiedAuthSessionEnabled()) {
    return NextResponse.json(
      { error: "Verified auth session is unavailable.", code: "VERIFIED_AUTH_DISABLED" },
      { status: 503 },
    );
  }

  const res = NextResponse.json({ code: "OK" });
  clearLjSessionCookie(res);
  return res;
}
