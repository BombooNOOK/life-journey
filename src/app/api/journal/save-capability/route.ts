import { NextResponse } from "next/server";

import { observeJournalIdentityShadow } from "@/lib/auth/observeJournalIdentityShadow";
import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import {
  disabledSaveCapability,
  resolveSaveCapability,
} from "@/lib/journal/saveIdempotency/rolloutProtocol";
import { isJournalSaveIdempotencyEnabled } from "@/lib/journal/saveIdempotency/journalSaveIdempotencyGate";
import { resolveJournalSaveWriteActorKey } from "@/lib/journal/saveIdempotency/resolveJournalSaveWriteActorKey";

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

  // Shadow baseline remains cookie-email (AI-X6.2).
  const legacyCookieActorKey = normalizeEmail(viewerEmail);
  try {
    await observeJournalIdentityShadow({
      route: "journal.save_capability",
      legacyCookieActorKey,
    });
  } catch {
    // Observe must never affect capability admission.
  }

  if (!isJournalSaveIdempotencyEnabled()) {
    return NextResponse.json(disabledSaveCapability(), NO_STORE);
  }

  // AI-X6.3: when stable-write flag ON, capability must evaluate the SAME
  // stableActorKey as new JSO writes (no email/UID mix). Unresolved → fail closed.
  const writeActor = await resolveJournalSaveWriteActorKey(viewerEmail);
  if (writeActor.mode === "stable_rejected") {
    return NextResponse.json(disabledSaveCapability(), NO_STORE);
  }
  const actorKey = writeActor.actorKey;

  try {
    const rollout = await prisma.journalSaveIdempotencyRollout.findUnique({
      where: { actorKey },
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
