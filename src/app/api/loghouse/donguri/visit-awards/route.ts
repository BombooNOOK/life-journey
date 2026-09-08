import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { runDonguriVisitAwardsForViewer } from "@/lib/loghouse/donguriVisitAwards";

/**
 * AI-X6.7C1.5A2-I3.6 — Explicit /orders visit Donguri awards.
 *
 * POST only. Authenticated viewer cookie → server resolves profile.
 * Client must not supply identityId / authoritative email.
 * GET must never mutate.
 */

export const runtime = "nodejs";

const NO_STORE = {
  headers: { "Cache-Control": "private, no-store, max-age=0, must-revalidate" },
} as const;

export async function POST() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, ...NO_STORE });
  }

  try {
    const result = await runDonguriVisitAwardsForViewer({ viewerEmail });
    return NextResponse.json(
      {
        ok: true,
        profileId: result.profileId,
        dailyDelivered: result.dailyDelivered,
        birthdayDelivered: result.birthdayDelivered,
        cho: result.cho,
      },
      NO_STORE,
    );
  } catch (e) {
    console.error("[POST /api/loghouse/donguri/visit-awards]", e);
    return NextResponse.json(
      { error: "Visit awards failed", code: "VISIT_AWARDS_FAILED" },
      { status: 500, ...NO_STORE },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method Not Allowed", code: "METHOD_NOT_ALLOWED" },
    { status: 405, ...NO_STORE },
  );
}
