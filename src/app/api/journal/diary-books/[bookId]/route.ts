import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { serializeDiaryBook } from "@/lib/journal/diaryBookDto";
import {
  deleteDiaryBookForViewer,
  loadDiaryBookDeleteEligibility,
} from "@/lib/journal/deleteDiaryBook";
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

  const [entryCount, deleteEligibility] = await Promise.all([
    countJournalEntriesInDiaryBookPeriod({
      email: viewerEmail,
      profileId: row.profileId,
      startDate: row.startDate,
      endDate: row.endDate,
    }),
    loadDiaryBookDeleteEligibility({ bookId: trimmedId, viewerEmail }),
  ]);

  return NextResponse.json(
    {
      book: serializeDiaryBook(row, entryCount),
      entryCount,
      deleteEligibility:
        deleteEligibility.ok && deleteEligibility.canDelete
          ? { canDelete: true as const }
          : deleteEligibility.ok && !deleteEligibility.canDelete
            ? {
                canDelete: false as const,
                code: deleteEligibility.reason.code,
                message: deleteEligibility.reason.message,
              }
            : { canDelete: false as const, code: "UNKNOWN", message: "削除可否を確認できませんでした。" },
      code: "OK",
    },
    JSON_NO_STORE,
  );
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json(
      { error: "ログイン情報を確認できませんでした。", code: "AUTH_REQUIRED" },
      { status: 401, ...JSON_NO_STORE },
    );
  }

  const { bookId } = await params;
  const result = await deleteDiaryBookForViewer({
    bookId,
    viewerEmail,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message, code: result.code },
      { status: result.status, ...JSON_NO_STORE },
    );
  }

  return NextResponse.json(
    { code: "OK", deletedBookId: result.deletedBookId },
    JSON_NO_STORE,
  );
}
