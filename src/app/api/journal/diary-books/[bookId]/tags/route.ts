import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { assertFullAccessForApi } from "@/lib/entitlement/requireFullAccess";
import { serializeDiaryBook } from "@/lib/journal/diaryBookDto";
import { countDiaryBookPeriodEntriesWithTagScope } from "@/lib/journal/diaryBookIncludePicker";
import { NO_INCLUDED_ENTRIES_IN_DIARY_BOOK_PERIOD_MESSAGE } from "@/lib/journal/diaryBookPeriod";
import { parseDiaryBookTagFilterFields } from "@/lib/journal/diaryBookTagFilter";
import { loadDiaryBookSettingsEditEligibility } from "@/lib/journal/diaryBookSettingsEdit";
import { countDiaryBookSnapshotEntries } from "@/lib/journal/diaryBookSnapshot";

const JSON_NO_STORE = {
  headers: {
    "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  },
} as const;

type RouteParams = { params: Promise<{ bookId: string }> };

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
  const eligibility = await loadDiaryBookSettingsEditEligibility({
    bookId,
    viewerEmail,
  });
  if (!eligibility.ok) {
    return NextResponse.json(
      { error: eligibility.message, code: eligibility.code },
      { status: 404, ...JSON_NO_STORE },
    );
  }
  if (!eligibility.canEditSettings) {
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

  const parsed = parseDiaryBookTagFilterFields(json);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, code: parsed.code },
      { status: parsed.status, ...JSON_NO_STORE },
    );
  }

  const tagScope = parsed.data;
  const book = eligibility.book;

  const counts = await countDiaryBookPeriodEntriesWithTagScope({
    email: viewerEmail,
    profileId: book.profileId,
    startDate: book.startDate,
    endDate: book.endDate,
    tagScope,
  });

  if (counts.includedCount < 1) {
    return NextResponse.json(
      {
        error: NO_INCLUDED_ENTRIES_IN_DIARY_BOOK_PERIOD_MESSAGE,
        code: "NO_INCLUDED_ENTRIES_IN_PERIOD",
      },
      { status: 422, ...JSON_NO_STORE },
    );
  }

  const updated = await prisma.diaryBook.update({
    where: { id: book.id },
    data: {
      tagFilter: tagScope.tagFilter,
      tagFilterMode: tagScope.tagFilterMode,
    },
  });

  const entryCount = await countDiaryBookSnapshotEntries({
    email: updated.email,
    profileId: updated.profileId,
    startDate: updated.startDate,
    endDate: updated.endDate,
    bookUpdatedAt: updated.updatedAt,
    tagScope,
  });

  return NextResponse.json(
    {
      book: serializeDiaryBook(updated, entryCount),
      code: "OK",
    },
    JSON_NO_STORE,
  );
}
