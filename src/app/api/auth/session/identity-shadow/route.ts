import { NextResponse } from "next/server";

import { getViewerIdentityShadowState } from "@/lib/auth/getViewerIdentityShadowState";
import { toPublicIdentityShadowReport } from "@/lib/auth/identityShadowState";
import { isVerifiedAuthSessionEnabled } from "@/lib/auth/verifiedAuthSessionGate";

/**
 * Read-only identity shadow diagnostic (AI-8.1c).
 *
 * Gate: LJD_VERIFIED_AUTH_SESSION_ENABLED=YES|1
 * No DB, no mutation, no remap. Not a public product API.
 * Response never includes raw UID/email.
 */

export const runtime = "nodejs";

export async function GET() {
  if (!isVerifiedAuthSessionEnabled()) {
    return NextResponse.json(
      {
        state: "disabled",
        legacyPresent: false,
        verifiedPresent: false,
        code: "VERIFIED_AUTH_DISABLED",
      },
      { status: 503 },
    );
  }

  // Ignore body/query — cookies only via helper.
  const shadow = await getViewerIdentityShadowState();
  const report = toPublicIdentityShadowReport(shadow);
  return NextResponse.json({ code: "OK", ...report });
}
