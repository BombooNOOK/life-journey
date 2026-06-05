import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { getJournalEntryPhotoRecordForViewer } from "@/lib/journal/journalEntryPhoto";
import { journalEntryPhotoApiPath } from "@/lib/journal/journalEntryPhotoPath";
import { loadJournalEntryPhotoPayload } from "@/lib/journal/journalEntryPhotoResolve";

const JSON_NO_STORE = {
  headers: {
    "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  },
} as const;

type RouteParams = { params: Promise<{ entryId: string }> };

export async function GET(req: Request, { params }: RouteParams) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json(
      { error: "ログイン情報を確認できませんでした。", code: "AUTH_REQUIRED" },
      { status: 401, ...JSON_NO_STORE },
    );
  }

  const { entryId } = await params;
  const row = await getJournalEntryPhotoRecordForViewer({ entryId, viewerEmail });
  if (!row) {
    return NextResponse.json(
      { error: "対象の記録が見つかりません。", code: "NOT_FOUND" },
      { status: 404, ...JSON_NO_STORE },
    );
  }

  const payload = await loadJournalEntryPhotoPayload(row);
  if (!payload) {
    return NextResponse.json(
      { error: "この記録に写真はありません。", code: "NO_PHOTO" },
      { status: 404, ...JSON_NO_STORE },
    );
  }

  const url = new URL(req.url);
  if (url.searchParams.get("format") === "json") {
    if (payload.kind === "legacy_json") {
      return NextResponse.json(
        { entryId: row.id, photoDataUrl: payload.photoDataUrl, code: "OK" },
        JSON_NO_STORE,
      );
    }
    return NextResponse.json(
      {
        entryId: row.id,
        photoDataUrl: null,
        photoSrc: journalEntryPhotoApiPath(row.id),
        code: "OK",
      },
      JSON_NO_STORE,
    );
  }

  if (payload.kind === "legacy_json") {
    return NextResponse.json(
      { entryId: row.id, photoDataUrl: payload.photoDataUrl, code: "OK" },
      JSON_NO_STORE,
    );
  }

  return new Response(new Uint8Array(payload.buffer), {
    status: 200,
    headers: {
      "Content-Type": payload.mimeType,
      "Cache-Control": "private, no-store, max-age=0, must-revalidate",
    },
  });
}
