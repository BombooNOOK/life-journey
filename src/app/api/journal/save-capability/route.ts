import { NextResponse } from "next/server";

import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import {
  disabledSaveCapability,
  resolveSaveCapability,
} from "@/lib/journal/saveIdempotency/rolloutProtocol";
import { isJournalSaveIdempotencyEnabled } from "@/lib/journal/saveIdempotency/journalSaveIdempotencyGate";

const NO_STORE = {
  headers: { "Cache-Control": "private, no-store, max-age=0, must-revalidate" },
} as const;

/**
 * Read-only account-scoped admission signal. It never reveals actor identity,
 * rollout membership, or the reason a caller is not eligible.
 */
export async function GET() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json(
      { error: "ログイン情報を確認できませんでした。", code: "AUTH_REQUIRED" },
      { status: 401, ...NO_STORE },
    );
  }

  if (!isJournalSaveIdempotencyEnabled()) {
    return NextResponse.json(disabledSaveCapability(), NO_STORE);
  }

  try {
    const rollout = await prisma.journalSaveIdempotencyRollout.findUnique({
      where: { actorKey: normalizeEmail(viewerEmail) },
      select: { enabled: true, protocolVersion: true },
    });
    return NextResponse.json(
      resolveSaveCapability({
        globalEnabled: true,
        rollout,
      }),
      NO_STORE,
    );
  } catch {
    // Fail closed: an unavailable rollout table/DB can never admit a client.
    return NextResponse.json(disabledSaveCapability(), NO_STORE);
  }
}
