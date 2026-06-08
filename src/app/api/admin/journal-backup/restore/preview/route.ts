import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin/requireAdminApi";
import {
  buildAdminRestorePreview,
  loadExtractedAdminRestoreZip,
  parseAdminRestoreTargetEmail,
} from "@/lib/journal/journalBackupAdminRestore";
import { JournalBackupValidationError } from "@/lib/journal/journalBackupValidate";
import { fetchAdminRestoreZipBuffer } from "@/lib/journal/journalBackupRestoreTempBlob";

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
      ? (json as { targetEmail?: unknown; blobUrl?: unknown; blobPathname?: unknown })
      : {};

  try {
    const targetEmail = parseAdminRestoreTargetEmail(body.targetEmail);
    const buffer = await fetchAdminRestoreZipBuffer({
      blobUrl: typeof body.blobUrl === "string" ? body.blobUrl : null,
      blobPathname: typeof body.blobPathname === "string" ? body.blobPathname : null,
    });
    const extracted = await loadExtractedAdminRestoreZip(buffer);
    const preview = await buildAdminRestorePreview({ targetEmail, extracted });

    console.info("[admin-restore-preview] ok", {
      adminEmail: admin.adminEmail,
      targetEmail: preview.targetEmail,
      entryCount: preview.entryCount,
      photoCount: preview.photoCount,
      validationOk: preview.validationOk,
      profileLimitOk: preview.profileLimitOk,
    });

    return NextResponse.json({ ok: true, preview }, JSON_NO_STORE);
  } catch (error) {
    if (error instanceof JournalBackupValidationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400, ...JSON_NO_STORE },
      );
    }
    const message = error instanceof Error ? error.message : "プレビューに失敗しました。";
    console.error("[admin-restore-preview] failed", {
      adminEmail: admin.adminEmail,
      error: message,
    });
    return NextResponse.json(
      { error: message, code: "PREVIEW_FAILED" },
      { status: 500, ...JSON_NO_STORE },
    );
  }
}
