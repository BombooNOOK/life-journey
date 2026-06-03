import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { listJournalEntriesForDiaryBookIncludePicker } from "@/lib/journal/diaryBookIncludePicker";
import { resolveActiveProfileId } from "@/lib/profile/activeProfile";

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

  const activeProfileId = await resolveActiveProfileId(viewerEmail);
  if (!activeProfileId) {
    return NextResponse.json(
      { error: "プロフィールを選択してください。", code: "NO_PROFILE" },
      { status: 403, ...JSON_NO_STORE },
    );
  }

  const { bookId } = await params;
  const row = await prisma.diaryBook.findFirst({
    where: {
      id: bookId.trim(),
      email: viewerEmail,
      profileId: activeProfileId,
    },
  });

  if (!row) {
    return NextResponse.json(
      { error: "日記ブックが見つかりません。", code: "NOT_FOUND" },
      { status: 404, ...JSON_NO_STORE },
    );
  }

  const entries = await listJournalEntriesForDiaryBookIncludePicker({
    email: viewerEmail,
    profileId: row.profileId,
    startDate: row.startDate,
    endDate: row.endDate,
  });

  return NextResponse.json(
    {
      book: {
        id: row.id,
        title: row.title,
        startDate: row.startDate,
        endDate: row.endDate,
      },
      entries,
      code: "OK",
    },
    JSON_NO_STORE,
  );
}
