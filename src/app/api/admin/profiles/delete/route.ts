import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin/requireAdminApi";
import {
  AdminProfileDeleteError,
  assertDeletableProfileId,
  deleteAdminProfileForUser,
  parseAdminProfileDeleteConfirmationWord,
  parseAdminProfileDeleteConfirmations,
  parseAdminProfileDeleteTargetEmail,
} from "@/lib/profile/adminProfileDelete";

export const runtime = "nodejs";
export const maxDuration = 120;

const JSON_NO_STORE = {
  headers: {
    "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  },
} as const;

export async function POST(request: Request) {
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { error: "JSON が不正です。", code: "BAD_JSON" },
      { status: 400, ...JSON_NO_STORE },
    );
  }

  const body =
    typeof json === "object" && json !== null
      ? (json as {
          targetEmail?: unknown;
          profileId?: unknown;
          confirmations?: unknown;
          confirmationWord?: unknown;
        })
      : {};

  try {
    parseAdminProfileDeleteConfirmations(body.confirmations);
    parseAdminProfileDeleteConfirmationWord(body.confirmationWord);
    const targetEmail = parseAdminProfileDeleteTargetEmail(body.targetEmail);
    const profileId = assertDeletableProfileId(
      typeof body.profileId === "string" ? body.profileId : "",
    );
    const result = await deleteAdminProfileForUser({ targetEmail, profileId });

    console.info("[admin-profile-delete] ok", {
      adminEmail: admin.adminEmail,
      targetEmail: result.targetEmail,
      profileId: result.profileId,
      deletedJournalEntryCount: result.deletedJournalEntryCount,
      failedPhotoBlobCount: result.failedPhotoBlobCount,
    });

    return NextResponse.json({ ok: true, result }, JSON_NO_STORE);
  } catch (error) {
    if (error instanceof AdminProfileDeleteError) {
      const status =
        error.code === "PROFILE_NOT_FOUND"
          ? 404
          : error.code === "DELETE_BLOCKED" ||
              error.code === "ORDER_EXISTS" ||
              error.code === "DIARY_BINDING_BLOCKED" ||
              error.code === "KANTEI_BINDING_BLOCKED"
            ? 409
            : 400;
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status, ...JSON_NO_STORE },
      );
    }
    const message = error instanceof Error ? error.message : "削除に失敗しました。";
    console.error("[admin-profile-delete] failed", {
      adminEmail: admin.adminEmail,
      error: message,
    });
    return NextResponse.json(
      { error: message, code: "DELETE_FAILED" },
      { status: 500, ...JSON_NO_STORE },
    );
  }
}
