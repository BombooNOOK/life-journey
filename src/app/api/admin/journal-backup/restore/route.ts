import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin/requireAdminApi";
import {
  buildAdminRestorePreview,
  loadExtractedAdminRestoreZip,
  parseAdminRestoreConfirmations,
  parseAdminRestoreTargetEmail,
} from "@/lib/journal/journalBackupAdminRestore";
import {
  JournalBackupRestoreFailure,
  restoreJournalBackupToNewProfile,
  type JournalBackupRestoreResult,
} from "@/lib/journal/journalBackupRestore";
import {
  deleteAdminRestoreZipBlobBestEffort,
  fetchAdminRestoreZipBuffer,
} from "@/lib/journal/journalBackupRestoreTempBlob";
import { JournalBackupValidationError } from "@/lib/journal/journalBackupValidate";

export const runtime = "nodejs";
export const maxDuration = 300;

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
          blobUrl?: unknown;
          blobPathname?: unknown;
          confirmations?: unknown;
        })
      : {};

  const blobUrl = typeof body.blobUrl === "string" ? body.blobUrl : null;
  const blobPathname = typeof body.blobPathname === "string" ? body.blobPathname : null;

  try {
    parseAdminRestoreConfirmations(body.confirmations);
    const targetEmail = parseAdminRestoreTargetEmail(body.targetEmail);
    const buffer = await fetchAdminRestoreZipBuffer({ blobUrl, blobPathname });
    const extracted = await loadExtractedAdminRestoreZip(buffer);
    const preview = await buildAdminRestorePreview({ targetEmail, extracted });

    if (!preview.validationOk) {
      return NextResponse.json(
        {
          error: "バックアップZIPの検証に失敗したため、復元できません。",
          code: "VALIDATION_FAILED",
          warnings: preview.warnings,
        },
        { status: 400, ...JSON_NO_STORE },
      );
    }

    if (!preview.profileLimitOk) {
      return NextResponse.json(
        {
          error:
            "このユーザーはプロフィール上限に達しているため、復元できません。不要なプロフィールを整理してから再度実行してください。",
          code: "PROFILE_LIMIT",
          profileLimit: preview.profileLimit,
          profileCount: preview.profileCount,
        },
        { status: 409, ...JSON_NO_STORE },
      );
    }

    const restore = (await restoreJournalBackupToNewProfile({
      viewerEmail: targetEmail,
      extracted,
    })) as JournalBackupRestoreResult;

    await deleteAdminRestoreZipBlobBestEffort({ blobUrl, blobPathname });

    console.info("[admin-restore] ok", {
      adminEmail: admin.adminEmail,
      targetEmail,
      profileId: restore.profileId,
      entryCount: restore.entryCount,
      photoCount: restore.photoCount,
    });

    return NextResponse.json(
      {
        ok: true,
        restore: {
          ...restore,
          targetEmail,
        },
      },
      JSON_NO_STORE,
    );
  } catch (error) {
    await deleteAdminRestoreZipBlobBestEffort({ blobUrl, blobPathname });

    if (error instanceof JournalBackupRestoreFailure) {
      console.error("[admin-restore] failed", {
        adminEmail: admin.adminEmail,
        code: error.code,
        stage: error.stage,
        rollbackOk: error.rollbackOk,
      });
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          stage: error.stage,
          rollbackOk: error.rollbackOk,
          retryable: error.retryable,
        },
        { status: 500, ...JSON_NO_STORE },
      );
    }

    if (error instanceof JournalBackupValidationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400, ...JSON_NO_STORE },
      );
    }

    const message = error instanceof Error ? error.message : "復元に失敗しました。";
    console.error("[admin-restore] failed", {
      adminEmail: admin.adminEmail,
      error: message,
    });
    return NextResponse.json(
      {
        error: message,
        code: "RESTORE_FAILED",
        stage: "validation",
        rollbackOk: true,
        retryable: true,
      },
      { status: 500, ...JSON_NO_STORE },
    );
  }
}
