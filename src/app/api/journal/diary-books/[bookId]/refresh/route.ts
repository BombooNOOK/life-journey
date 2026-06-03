import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { refreshDiaryBookContent } from "@/lib/journal/diaryBookSnapshot";

const JSON_NO_STORE = {
  headers: {
    "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  },
} as const;

type RouteParams = { params: Promise<{ bookId: string }> };

export async function POST(_: Request, { params }: RouteParams) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json(
      { error: "ログイン情報を確認できませんでした。", code: "AUTH_REQUIRED" },
      { status: 401, ...JSON_NO_STORE },
    );
  }

  const { bookId } = await params;
  const result = await refreshDiaryBookContent({ bookId, viewerEmail });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: result.status, ...JSON_NO_STORE },
    );
  }

  return NextResponse.json(
    {
      entryCount: result.entryCount,
      updatedAt: result.updatedAt,
      code: "OK",
    },
    JSON_NO_STORE,
  );
}
