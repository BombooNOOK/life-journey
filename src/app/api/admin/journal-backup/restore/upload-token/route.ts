import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin/requireAdminApi";
import {
  assertAdminRestoreBlobPathname,
  JOURNAL_BACKUP_MAX_ZIP_BYTES,
} from "@/lib/journal/journalBackupValidate";
import { adminRestoreTempBlobWriteEnabled } from "@/lib/journal/journalBackupRestoreTempBlob";

export const runtime = "nodejs";

const JSON_NO_STORE = {
  headers: {
    "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  },
} as const;

export async function POST(request: Request) {
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;

  if (!adminRestoreTempBlobWriteEnabled()) {
    return NextResponse.json(
      {
        error: "一時ZIPアップロード設定がありません（BLOB_READ_WRITE_TOKEN）。",
        code: "BLOB_WRITE_DISABLED",
      },
      { status: 503, ...JSON_NO_STORE },
    );
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json(
      { error: "リクエスト本文が不正です。", code: "BAD_JSON" },
      { status: 400, ...JSON_NO_STORE },
    );
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        assertAdminRestoreBlobPathname(pathname);
        return {
          allowedContentTypes: [
            "application/zip",
            "application/x-zip-compressed",
            "application/octet-stream",
          ],
          maximumSizeInBytes: JOURNAL_BACKUP_MAX_ZIP_BYTES,
          addRandomSuffix: false,
          allowOverwrite: true,
        };
      },
      onUploadCompleted: async () => {
        // 日記本文・写真はログに出さない
      },
    });
    return NextResponse.json(jsonResponse, JSON_NO_STORE);
  } catch (error) {
    console.error("[admin-restore-upload-token] failed", {
      adminEmail: admin.adminEmail,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "一時ZIPのアップロード準備に失敗しました。", code: "UPLOAD_TOKEN_FAILED" },
      { status: 500, ...JSON_NO_STORE },
    );
  }
}
