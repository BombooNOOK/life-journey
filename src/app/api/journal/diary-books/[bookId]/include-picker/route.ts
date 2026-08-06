import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import {
  filterDiaryBookPickerEntriesByTagScope,
  listJournalEntriesForDiaryBookIncludePicker,
} from "@/lib/journal/diaryBookIncludePicker";
import {
  diaryBookTagScopeFromRow,
  formatDiaryBookTagScopeSummary,
} from "@/lib/journal/diaryBookTagFilter";
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
      { error: "あしあとブックが見つかりません。", code: "NOT_FOUND" },
      { status: 404, ...JSON_NO_STORE },
    );
  }

  const tagScope = diaryBookTagScopeFromRow(row);

  let entries;
  try {
    const allEntries = await listJournalEntriesForDiaryBookIncludePicker({
      email: viewerEmail,
      profileId: row.profileId,
      startDate: row.startDate,
      endDate: row.endDate,
      pageTemplate: row.pageTemplate,
    });
    entries = await filterDiaryBookPickerEntriesByTagScope({
      email: viewerEmail,
      profileId: row.profileId,
      entries: allEntries,
      tagScope,
    });
  } catch (e) {
    console.error("[include-picker] list failed", { bookId: row.id, error: e });
    return NextResponse.json(
      {
        error: "あしあと一覧の取得に失敗しました。時間をおいて再度お試しください。",
        code: "LIST_FAILED",
      },
      { status: 500, ...JSON_NO_STORE },
    );
  }

  const matchingEntryCount = entries.length;
  const includedCount = entries.filter((entry) => entry.includeInBook).length;

  return NextResponse.json(
    {
      book: {
        id: row.id,
        title: row.title,
        startDate: row.startDate,
        endDate: row.endDate,
        pageTemplate: row.pageTemplate,
        tagFilter: tagScope.tagFilter,
        tagFilterMode: tagScope.tagFilterMode,
        tagScopeSummary: formatDiaryBookTagScopeSummary(tagScope),
      },
      entries,
      matchingEntryCount,
      includedCount,
      code: "OK",
    },
    JSON_NO_STORE,
  );
}
