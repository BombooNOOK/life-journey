import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { getJournalEntryPhotoForViewer } from "@/lib/journal/journalEntryPhoto";

const JSON_NO_STORE = {
  headers: {
    "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  },
} as const;

type RouteParams = { params: Promise<{ entryId: string }> };

export async function GET(_: Request, { params }: RouteParams) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json(
      { error: "ログイン情報を確認できませんでした。", code: "AUTH_REQUIRED" },
      { status: 401, ...JSON_NO_STORE },
    );
  }

  const { entryId } = await params;
  const photo = await getJournalEntryPhotoForViewer({ entryId, viewerEmail });
  if (!photo) {
    return NextResponse.json(
      { error: "対象の記録が見つかりません。", code: "NOT_FOUND" },
      { status: 404, ...JSON_NO_STORE },
    );
  }

  return NextResponse.json(
    {
      entryId: photo.entryId,
      photoDataUrl: photo.photoDataUrl,
      code: "OK",
    },
    JSON_NO_STORE,
  );
}
