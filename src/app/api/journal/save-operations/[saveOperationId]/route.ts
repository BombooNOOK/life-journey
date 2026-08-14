import { NextResponse } from "next/server";

import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
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
 */
export async function GET(request: Request, context: RouteContext) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, ...NO_STORE });
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

  try {
    const row = await prisma.journalSaveOperation.findUnique({
      where: {
        actorKey_saveOperationId: {
          actorKey: normalizeEmail(viewerEmail),
          saveOperationId: parsedId.saveOperationId,
        },
      },
      select: {
        status: true,
        journalEntryId: true,
        requestFingerprint: true,
        resultCode: true,
      },
    });
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
