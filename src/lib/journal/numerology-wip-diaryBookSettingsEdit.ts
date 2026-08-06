import { prisma } from "@/lib/db";
import { expireStaleUnpaidPendingForScope } from "@/lib/commerce/diaryBookBindingPendingLifecycle";
import { findBlockingDiaryBookBindingRequest } from "@/lib/journal/deleteDiaryBook";
import { diaryBookTagScopeFromRow } from "@/lib/journal/diaryBookTagFilter";

export const DIARY_BOOK_SETTINGS_EDIT_BLOCKED_MESSAGE =
  "このあしあとブックは製本申込中のため、対象期間やタグ条件を変更できません。内容を変えたい場合は、新しいあしあとブックとして作成してください。";

/** @deprecated {@link DIARY_BOOK_SETTINGS_EDIT_BLOCKED_MESSAGE} と同じ */
export const DIARY_BOOK_PERIOD_EDIT_BLOCKED_MESSAGE = DIARY_BOOK_SETTINGS_EDIT_BLOCKED_MESSAGE;

export type DiaryBookSettingsBookRow = {
  id: string;
  title: string;
  profileId: string;
  startDate: string;
  endDate: string;
  tagFilter: string;
  tagFilterMode: string;
};

export type DiaryBookSettingsEditEligibility =
  | {
      ok: true;
      book: DiaryBookSettingsBookRow;
      canEditSettings: true;
    }
  | {
      ok: true;
      book: DiaryBookSettingsBookRow;
      canEditSettings: false;
      code: "BINDING_BLOCKED";
      message: string;
    }
  | { ok: false; code: "NOT_FOUND"; message: string };

export async function loadDiaryBookSettingsEditEligibility(params: {
  bookId: string;
  viewerEmail: string;
}): Promise<DiaryBookSettingsEditEligibility> {
  const trimmedId = params.bookId.trim();
  const book = await prisma.diaryBook.findFirst({
    where: { id: trimmedId, email: params.viewerEmail },
    select: {
      id: true,
      title: true,
      profileId: true,
      startDate: true,
      endDate: true,
      tagFilter: true,
      tagFilterMode: true,
    },
  });
  if (!book) {
    return { ok: false, code: "NOT_FOUND", message: "あしあとブックが見つかりません。" };
  }

  await expireStaleUnpaidPendingForScope({ diaryBookId: book.id });

  const bindings = await prisma.diaryBookBindingRequest.findMany({
    where: { diaryBookId: book.id, email: params.viewerEmail },
    select: {
      id: true,
      status: true,
      baseOrderNumber: true,
      createdAt: true,
      diaryBindingCode: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const block = findBlockingDiaryBookBindingRequest(bindings);
  if (block) {
    return {
      ok: true,
      book,
      canEditSettings: false,
      code: "BINDING_BLOCKED",
      message: DIARY_BOOK_SETTINGS_EDIT_BLOCKED_MESSAGE,
    };
  }

  return { ok: true, book, canEditSettings: true };
}

export type DiaryBookPeriodEditEligibility =
  | {
      ok: true;
      book: DiaryBookSettingsBookRow;
      canEditPeriod: true;
    }
  | {
      ok: true;
      book: DiaryBookSettingsBookRow;
      canEditPeriod: false;
      code: "BINDING_BLOCKED";
      message: string;
    }
  | { ok: false; code: "NOT_FOUND"; message: string };

export async function loadDiaryBookPeriodEditEligibility(params: {
  bookId: string;
  viewerEmail: string;
}): Promise<DiaryBookPeriodEditEligibility> {
  const result = await loadDiaryBookSettingsEditEligibility(params);
  if (!result.ok) return result;
  if (!result.canEditSettings) {
    return {
      ok: true,
      book: result.book,
      canEditPeriod: false,
      code: result.code,
      message: result.message,
    };
  }
  return { ok: true, book: result.book, canEditPeriod: true };
}

export function diaryBookTagScopeFromSettingsBook(
  book: Pick<DiaryBookSettingsBookRow, "tagFilter" | "tagFilterMode">,
) {
  return diaryBookTagScopeFromRow(book);
}
