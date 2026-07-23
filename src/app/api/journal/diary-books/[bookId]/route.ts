import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { assertFullAccessForApi } from "@/lib/entitlement/requireFullAccess";
import { serializeDiaryBook } from "@/lib/journal/diaryBookDto";
import { parseDiaryBookPeriodFields } from "@/lib/journal/diaryBookForm";
import {
  deleteDiaryBookForViewer,
  loadDiaryBookDeleteEligibility,
} from "@/lib/journal/deleteDiaryBook";
import { countDiaryBookPeriodEntriesWithTagScope } from "@/lib/journal/diaryBookIncludePicker";
import {
  NO_INCLUDED_ENTRIES_IN_DIARY_BOOK_PERIOD_MESSAGE,
} from "@/lib/journal/diaryBookPeriod";
import { diaryBookTagScopeFromRow } from "@/lib/journal/diaryBookTagFilter";
import { loadDiaryBookPeriodEditEligibility } from "@/lib/journal/diaryBookPeriodEdit";
import { countDiaryBookSnapshotEntries } from "@/lib/journal/diaryBookSnapshot";

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

  const tagScope = diaryBookTagScopeFromRow(row);

  const [entryCount, deleteEligibility] = await Promise.all([
    countDiaryBookSnapshotEntries({
      email: viewerEmail,
      profileId: row.profileId,
      startDate: row.startDate,
      endDate: row.endDate,
      bookUpdatedAt: row.updatedAt,
      tagScope,
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

export async function PATCH(req: Request, { params }: RouteParams) {
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
  const eligibility = await loadDiaryBookPeriodEditEligibility({
    bookId,
    viewerEmail,
  });
  if (!eligibility.ok) {
    return NextResponse.json(
      { error: eligibility.message, code: eligibility.code },
      { status: 404, ...JSON_NO_STORE },
    );
  }
  if (!eligibility.canEditPeriod) {
    return NextResponse.json(
      { error: eligibility.message, code: eligibility.code },
      { status: 409, ...JSON_NO_STORE },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { error: "JSONが不正です。", code: "BAD_JSON" },
      { status: 400, ...JSON_NO_STORE },
    );
  }

  const parsed = parseDiaryBookPeriodFields(json);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, code: parsed.code },
      { status: parsed.status, ...JSON_NO_STORE },
    );
  }

  const tagScope = diaryBookTagScopeFromRow(eligibility.book);

  const includedCount = await countDiaryBookPeriodEntriesWithTagScope({
    email: viewerEmail,
    profileId: eligibility.book.profileId,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
    tagScope,
  });
  if (includedCount.includedCount < 1) {
    return NextResponse.json(
      {
        error: NO_INCLUDED_ENTRIES_IN_DIARY_BOOK_PERIOD_MESSAGE,
        code: "NO_INCLUDED_ENTRIES_IN_PERIOD",
      },
      { status: 422, ...JSON_NO_STORE },
    );
  }

  const updated = await prisma.diaryBook.update({
    where: { id: eligibility.book.id },
    data: {
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
    },
  });

  const entryCount = await countDiaryBookSnapshotEntries({
    email: updated.email,
    profileId: updated.profileId,
    startDate: updated.startDate,
    endDate: updated.endDate,
    bookUpdatedAt: updated.updatedAt,
    tagScope: diaryBookTagScopeFromRow(updated),
  });

  return NextResponse.json(
    {
      book: serializeDiaryBook(updated, entryCount),
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
