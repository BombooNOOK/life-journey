import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { assertFullAccessForApi } from "@/lib/entitlement/requireFullAccess";
import {
  countDiaryBookPeriodEntriesWithTagScope,
  filterDiaryBookPickerEntriesByTagScope,
  listJournalEntriesForDiaryBookIncludePicker,
} from "@/lib/journal/diaryBookIncludePicker";
import {
  NO_ENTRIES_IN_DIARY_BOOK_PERIOD_MESSAGE,
  NO_INCLUDED_ENTRIES_IN_DIARY_BOOK_PERIOD_MESSAGE,
} from "@/lib/journal/diaryBookPeriod";
import { parseDiaryBookTagFilterFields } from "@/lib/journal/diaryBookTagFilter";
import { loadDiaryBookSettingsEditEligibility } from "@/lib/journal/diaryBookSettingsEdit";

const JSON_NO_STORE = {
  headers: {
    "Cache-Control": "private, no-store, max-age=0, must-revalidate",
  },
} as const;

type RouteParams = { params: Promise<{ bookId: string }> };

export async function POST(req: Request, { params }: RouteParams) {
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

  const book = eligibility.book;
  const tagScope = parsed.data;

  const pickerEntriesAll = await listJournalEntriesForDiaryBookIncludePicker({
    email: viewerEmail,
    profileId: book.profileId,
    startDate: book.startDate,
    endDate: book.endDate,
    pageTemplate: book.pageTemplate,
  });

  const pickerEntries = await filterDiaryBookPickerEntriesByTagScope({
    email: viewerEmail,
    profileId: book.profileId,
    entries: pickerEntriesAll,
    tagScope,
  });

  const counts = await countDiaryBookPeriodEntriesWithTagScope({
    email: viewerEmail,
    profileId: book.profileId,
    startDate: book.startDate,
    endDate: book.endDate,
    tagScope,
  });

  const entryCount = counts.includedCount;
  const matchingEntryCount = counts.matchingCount;
  const canUpdate = entryCount > 0;
  const message = canUpdate
    ? undefined
    : matchingEntryCount === 0
      ? NO_ENTRIES_IN_DIARY_BOOK_PERIOD_MESSAGE
      : NO_INCLUDED_ENTRIES_IN_DIARY_BOOK_PERIOD_MESSAGE;

  return NextResponse.json(
    {
      entryCount,
      matchingEntryCount,
      canUpdate,
      entries: pickerEntries,
      tagFilter: tagScope.tagFilter,
      tagFilterMode: tagScope.tagFilterMode,
      ...(message ? { message } : {}),
      code: "OK",
    },
    JSON_NO_STORE,
  );
}
