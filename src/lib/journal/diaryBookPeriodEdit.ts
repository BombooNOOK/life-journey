import { prisma } from "@/lib/db";
import { expireStaleUnpaidPendingForScope } from "@/lib/commerce/diaryBookBindingPendingLifecycle";
import { findBlockingDiaryBookBindingRequest } from "@/lib/journal/deleteDiaryBook";

export const DIARY_BOOK_PERIOD_EDIT_BLOCKED_MESSAGE =
  "この日記ブックは製本申込中のため、対象期間を変更できません。内容を変えたい場合は、新しい日記ブックとして作成してください。";

export type DiaryBookPeriodEditEligibility =
  | {
      ok: true;
      book: {
        id: string;
        title: string;
        profileId: string;
        startDate: string;
        endDate: string;
      };
      canEditPeriod: true;
    }
  | {
      ok: true;
      book: {
        id: string;
        title: string;
        profileId: string;
        startDate: string;
        endDate: string;
      };
      canEditPeriod: false;
      code: "BINDING_BLOCKED";
      message: string;
    }
  | { ok: false; code: "NOT_FOUND"; message: string };

export async function loadDiaryBookPeriodEditEligibility(params: {
  bookId: string;
  viewerEmail: string;
}): Promise<DiaryBookPeriodEditEligibility> {
  const trimmedId = params.bookId.trim();
  const book = await prisma.diaryBook.findFirst({
    where: { id: trimmedId, email: params.viewerEmail },
    select: {
      id: true,
      title: true,
      profileId: true,
      startDate: true,
      endDate: true,
    },
  });
  if (!book) {
    return { ok: false, code: "NOT_FOUND", message: "日記ブックが見つかりません。" };
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
      canEditPeriod: false,
      code: "BINDING_BLOCKED",
      message: DIARY_BOOK_PERIOD_EDIT_BLOCKED_MESSAGE,
    };
  }

  return { ok: true, book, canEditPeriod: true };
}
