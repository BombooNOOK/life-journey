import { Readable } from "node:stream";

import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { startJournalBackupZipStream } from "@/lib/journal/journalBackupExport";
import { profileByIdForViewer, resolveActiveProfileId } from "@/lib/profile/activeProfile";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET() {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json(
      { error: "ログイン情報を確認できませんでした。", code: "AUTH_REQUIRED" },
      { status: 401 },
    );
  }

  const profileId = await resolveActiveProfileId(viewerEmail);
  const profile = await profileByIdForViewer(profileId, viewerEmail);
  if (!profile) {
    return NextResponse.json(
      { error: "バックアップ対象のプロフィールが見つかりません。", code: "PROFILE_NOT_FOUND" },
      { status: 404 },
    );
  }

  try {
    const { stream, filename } = await startJournalBackupZipStream({
      viewerEmail,
      profileId: profile.id,
      profileNickname: profile.nickname,
    });

    const webStream = Readable.toWeb(stream) as ReadableStream<Uint8Array>;

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[journal-backup] export failed", error);
    return NextResponse.json(
      {
        error: "バックアップの作成に失敗しました。しばらくしてから再度お試しください。",
        code: "BACKUP_FAILED",
      },
      { status: 500 },
    );
  }
}
