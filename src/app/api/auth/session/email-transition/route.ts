import { NextResponse } from "next/server";

import { isIdentityBindingEnabled } from "@/lib/auth/identityBindingGate";
import {
  runSameUidEmailTransition,
  toPublicSameUidEmailTransitionResponse,
} from "@/lib/auth/sameUidEmailTransition";
import { isSameUidEmailTransitionEnabled } from "@/lib/auth/sameUidEmailTransitionGate";
import { isVerifiedAuthSessionEnabled } from "@/lib/auth/verifiedAuthSessionGate";

/**
 * AI-X6.7C1.5A2-I2 — Same-UID AccountIdentityEmail transition.
 *
 * Gates (all required):
 *   LJD_VERIFIED_AUTH_SESSION_ENABLED=YES|1
 *   LJD_IDENTITY_BINDING_ENABLED=YES|1
 *   LJD_SAME_UID_EMAIL_TRANSITION_ENABLED=YES|1
 *
 * Authority: verified lj_session firebaseUid + session email as NEW email only.
 * Body supplies expectedPreviousEmail (optimistic concurrency), never newEmail authority.
 * Never writes LegacyActorClaim or product legacy email columns.
 * Does not call profile/donguri/orders bootstrap helpers.
 */

export const runtime = "nodejs";

const NO_STORE = {
  headers: { "Cache-Control": "private, no-store, max-age=0, must-revalidate" },
} as const;

function parseExpectedPreviousEmail(body: unknown): string | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const raw = (body as Record<string, unknown>).expectedPreviousEmail;
  if (typeof raw !== "string") return null;
  return raw;
}

export async function POST(request: Request) {
  if (
    !isVerifiedAuthSessionEnabled() ||
    !isIdentityBindingEnabled() ||
    !isSameUidEmailTransitionEnabled()
  ) {
    return NextResponse.json(
      { code: "disabled", state: "disabled" },
      { status: 503, ...NO_STORE },
    );
  }

  let body: unknown = null;
  try {
    const text = await request.text();
    if (text.trim()) {
      body = JSON.parse(text) as unknown;
    }
  } catch {
    return NextResponse.json(
      { code: "invalid_request", state: "invalid_request" },
      { status: 400, ...NO_STORE },
    );
  }

  const expectedPreviousEmail = parseExpectedPreviousEmail(body);
  if (expectedPreviousEmail == null) {
    return NextResponse.json(
      { code: "invalid_request", state: "invalid_request" },
      { status: 400, ...NO_STORE },
    );
  }

  // Intentionally ignore body.newEmail / uid / email — verified session only.
  const result = await runSameUidEmailTransition({ expectedPreviousEmail });
  const publicResult = toPublicSameUidEmailTransitionResponse(result);
  return NextResponse.json(
    { code: publicResult.code, state: publicResult.state },
    { status: publicResult.status, ...NO_STORE },
  );
}

export async function GET() {
  return NextResponse.json(
    { code: "method_not_allowed", state: "disabled" },
    { status: 405, ...NO_STORE },
  );
}
