import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { assertFullAccessForApi } from "@/lib/entitlement/requireFullAccess";
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

  const denied = await assertFullAccessForApi(viewerEmail);
  if (denied) return denied;

  const { bookId } = await params;
  let result;
  try {
    result = await refreshDiaryBookContent({ bookId, viewerEmail });
  } catch (e) {
    console.error("[diary-book-refresh] failed", { bookId, error: e });
    return NextResponse.json(
      {
        error: "あしあとブックの更新に失敗しました。時間をおいて再度お試しください。",
        code: "REFRESH_FAILED",
      },
      { status: 500, ...JSON_NO_STORE },
    );
  }
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
      needsContentRefresh: result.needsContentRefresh,
      code: "OK",
    },
    JSON_NO_STORE,
  );
}
