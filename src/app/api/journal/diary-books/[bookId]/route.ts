import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { serializeDiaryBook } from "@/lib/journal/diaryBookDto";
import { countJournalEntriesInDiaryBookPeriod } from "@/lib/journal/diaryBookPeriod";

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
  const trimmedId = bookId.trim();
  if (!trimmedId) {
    return NextResponse.json(
      { error: "日記ブックが見つかりません。", code: "NOT_FOUND" },
      { status: 404, ...JSON_NO_STORE },
    );
  }

  const row = await prisma.diaryBook.findFirst({
    where: { id: trimmedId, email: viewerEmail },
  });

  if (!row) {
    return NextResponse.json(
      { error: "日記ブックが見つかりません。", code: "NOT_FOUND" },
      { status: 404, ...JSON_NO_STORE },
    );
  }

  const entryCount = await countJournalEntriesInDiaryBookPeriod({
    email: viewerEmail,
    profileId: row.profileId,
    startDate: row.startDate,
    endDate: row.endDate,
  });

  return NextResponse.json(
    {
      book: serializeDiaryBook(row, entryCount),
      entryCount,
      code: "OK",
    },
    JSON_NO_STORE,
  );
}
