import { NextResponse } from "next/server";

import { observeJournalIdentityShadow } from "@/lib/auth/observeJournalIdentityShadow";
import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { findJournalSaveOperationByAuthorizedActorKeys } from "@/lib/journal/saveIdempotency/findJournalSaveOperationByAuthorizedActorKeys";
import { resolveJournalSaveRecoveryAuthority } from "@/lib/journal/saveIdempotency/resolveJournalSaveRecoveryAuthority";
import { stableJsoWriteRejectHttp } from "@/lib/journal/saveIdempotency/resolveJournalSaveWriteActorKey";
import {
  toPublicSaveOperationLookup,
} from "@/lib/journal/saveIdempotency/rolloutProtocol";
import { parseSaveOperationId } from "@/lib/journal/saveIdempotency/saveOperationId";

const NO_STORE = {
  headers: { "Cache-Control": "private, no-store, max-age=0, must-revalidate" },
} as const;

type RouteContext = { params: Promise<{ saveOperationId: string }> };

/**
 * Read-only same-operation recovery lookup.
 *
 * Existing operation recovery is intentionally not gated by current rollout
 * eligibility or the global admission flag: disabling a cohort must not strand
 * an authenticated owner with an already-created operation. New admission
 * remains controlled solely by save-capability.
 *
 * AI-X6.4: when LJD_STABLE_JSO_RECOVERY_ENABLED is ON, lookup uses
 * firebase:<UID> + explicit LegacyActorClaim actorKeys. Flag OFF keeps
 * cookie-email actorKey exactly as before. Never grants access from current
 * email alone.
 */
export async function GET(request: Request, context: RouteContext) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json(
      { error: "ログイン情報を確認できませんでした。", code: "AUTH_REQUIRED" },
      { status: 401, ...NO_STORE },
    );
  }

  const parsedId = parseSaveOperationId((await context.params).saveOperationId);
  if (!parsedId.ok) {
    return NextResponse.json(
      { error: "saveOperationId の形式が不正です。", code: "BAD_SAVE_OPERATION_ID" },
      { status: 400, ...NO_STORE },
    );
  }

  const fingerprint = new URL(request.url).searchParams.get("requestFingerprint")?.trim();
  if (!fingerprint) {
    return NextResponse.json(
      { error: "requestFingerprint が必要です。", code: "REQUEST_FINGERPRINT_REQUIRED" },
      { status: 400, ...NO_STORE },
    );
  }

  // Shadow baseline remains cookie-email (AI-X6.2).
  const legacyCookieActorKey = normalizeEmail(viewerEmail);
  try {
    await observeJournalIdentityShadow({
      route: "journal.save_operations.lookup",
      legacyCookieActorKey,
      saveOperationId: parsedId.saveOperationId,
    });
  } catch {
    // Observe must never affect recovery lookup authority.
  }

  const authority = await resolveJournalSaveRecoveryAuthority(viewerEmail);
  if (authority.mode === "stable_rejected") {
    const reject = stableJsoWriteRejectHttp(authority.reason);
    return NextResponse.json(reject.body, {
      status: reject.status,
      ...NO_STORE,
    });
  }

  try {
    const lookup = await findJournalSaveOperationByAuthorizedActorKeys(prisma, {
      actorKeys: authority.actorKeys,
      saveOperationId: parsedId.saveOperationId,
    });

    if (lookup.kind === "ambiguous") {
      // Fail closed — never pick among duplicates. No actorKeys/emails exposed.
      return NextResponse.json(
        {
          error: "保存状態を一意に特定できません。",
          code: "JSO_RECOVERY_AMBIGUOUS",
        },
        { status: 409, ...NO_STORE },
      );
    }

    const row = lookup.kind === "found" ? lookup.row : null;
    // Scoped query means another actor's identical ID is indistinguishable from absent.
    return NextResponse.json(
      toPublicSaveOperationLookup({
        row,
        suppliedFingerprint: fingerprint,
      }),
      NO_STORE,
    );
  } catch {
    // Do not disclose DB/vendor failure details. The client must not retry blindly.
    return NextResponse.json(
      { error: "保存状態を確認できません。", code: "SAVE_OPERATION_LOOKUP_UNAVAILABLE" },
      { status: 503, ...NO_STORE },
    );
  }
}
