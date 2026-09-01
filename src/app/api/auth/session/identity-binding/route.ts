import { NextResponse } from "next/server";

import {
  ensureVerifiedAccountIdentity,
  toPublicIdentityBindingResponse,
} from "@/lib/auth/ensureVerifiedAccountIdentity";
import { isIdentityBindingEnabled } from "@/lib/auth/identityBindingGate";
import { isVerifiedAuthSessionEnabled } from "@/lib/auth/verifiedAuthSessionGate";

/**
 * Local/manual diagnostic: verified AccountIdentity self-binding (AI-8.3a).
 *
 * Gates:
 *   LJD_IDENTITY_BINDING_ENABLED=YES|1
 *   LJD_VERIFIED_AUTH_SESSION_ENABLED=YES|1
 *
 * Authority: verified lj_session only. Ignores request body UID/email.
 * Never writes LegacyActorClaim. Not wired to onIdTokenChanged.
 * Response never includes raw UID/email.
 */

export const runtime = "nodejs";

const NO_STORE = {
  headers: { "Cache-Control": "private, no-store, max-age=0, must-revalidate" },
} as const;

export async function POST(_request: Request) {
  if (!isVerifiedAuthSessionEnabled() || !isIdentityBindingEnabled()) {
    return NextResponse.json(
      { code: "disabled", state: "disabled" },
      { status: 503, ...NO_STORE },
    );
  }

  // Intentionally ignore request body — verified session is the only authority.
  const result = await ensureVerifiedAccountIdentity();
  const publicResult = toPublicIdentityBindingResponse(result);
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
