import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { getDiaryBookWithEntriesForViewer } from "@/lib/journal/listDiaryBookEntries";

const JSON_NO_STORE = {
  headers: {
    "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  },
} as const;

type RouteParams = { params: Promise<{ bookId: string }> };

export async function GET(_: Request, { params }: RouteParams) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json(
      { error: "ログイン情報を確認できませんでした。", code: "AUTH_REQUIRED" },
      { status: 401, ...JSON_NO_STORE },
    );
  }

  const { bookId } = await params;
  const payload = await getDiaryBookWithEntriesForViewer({
    bookId,
    viewerEmail,
  });

  if (!payload) {
    return NextResponse.json(
      { error: "あしあとブックが見つかりません。", code: "NOT_FOUND" },
      { status: 404, ...JSON_NO_STORE },
    );
  }

  return NextResponse.json(
    {
      book: payload.book,
      profileId: payload.profileId,
      entries: payload.entries,
      needsContentRefresh: payload.book.needsContentRefresh === true,
      code: "OK",
    },
    JSON_NO_STORE,
  );
}
