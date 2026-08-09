import { prisma } from "@/lib/db";
import {
  expireStaleUnpaidPendingForScope,
  hasBaseOrderNumber,
  isStaleUnpaidPending,
} from "@/lib/commerce/diaryBookBindingPendingLifecycle";
import { DIARY_BOOK_BINDING_STATUS_LABELS } from "@/lib/commerce/diaryBookBindingStatus";

export type DiaryBookBindingBlockRow = {
  id: string;
  status: string;
  baseOrderNumber: string | null;
  createdAt: Date;
  diaryBindingCode: string;
};

export type DiaryBookDeleteBlockReason =
  | { code: "BINDING_PENDING"; message: string; bindingCode: string }
  | { code: "BINDING_ORDERED"; message: string; bindingCode: string; statusLabel: string }
  | { code: "BINDING_IN_PROGRESS"; message: string; bindingCode: string; statusLabel: string };

export function findBlockingDiaryBookBindingRequest(
  rows: DiaryBookBindingBlockRow[],
  now = new Date(),
): DiaryBookDeleteBlockReason | null {
  for (const row of rows) {
    if (row.status === "ordered" || row.status === "in_production" || row.status === "shipped") {
      const statusLabel =
        DIARY_BOOK_BINDING_STATUS_LABELS[
          row.status as keyof typeof DIARY_BOOK_BINDING_STATUS_LABELS
        ] ?? row.status;
      return {
        code: row.status === "ordered" ? "BINDING_ORDERED" : "BINDING_IN_PROGRESS",
        message:
          row.status === "ordered"
            ? `製本申込（${row.diaryBindingCode}）は決済確認済みのため、このあしあとブックは削除できません。`
            : `製本申込（${row.diaryBindingCode}）は${statusLabel}のため、このあしあとブックは削除できません。`,
        bindingCode: row.diaryBindingCode,
        statusLabel,
      };
    }

    if (row.status !== "pending") continue;

    if (hasBaseOrderNumber(row.baseOrderNumber)) {
      return {
        code: "BINDING_ORDERED",
        message: `製本申込（${row.diaryBindingCode}）は決済情報が登録済みのため、このあしあとブックは削除できません。`,
        bindingCode: row.diaryBindingCode,
        statusLabel: DIARY_BOOK_BINDING_STATUS_LABELS.pending,
      };
    }

    if (!isStaleUnpaidPending(row, now)) {
      return {
        code: "BINDING_PENDING",
        message: `製本申込予定（${row.diaryBindingCode}）が有効です。先に取り下げるか、期限切れになるまでお待ちください。`,
        bindingCode: row.diaryBindingCode,
      };
    }
  }

  return null;
}

export async function loadDiaryBookDeleteEligibility(params: {
  bookId: string;
  viewerEmail: string;
}): Promise<
  | {
      ok: true;
      book: { id: string; title: string; profileId: string };
      canDelete: true;
    }
  | {
      ok: true;
      book: { id: string; title: string; profileId: string };
      canDelete: false;
      reason: DiaryBookDeleteBlockReason;
    }
  | { ok: false; code: "NOT_FOUND"; message: string }
> {
  const trimmedId = params.bookId.trim();
  const book = await prisma.diaryBook.findFirst({
    where: { id: trimmedId, email: params.viewerEmail },
    select: { id: true, title: true, profileId: true },
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
      canDelete: false,
      reason: block,
    };
  }

  return { ok: true, book, canDelete: true };
}

export async function deleteDiaryBookForViewer(params: {
  bookId: string;
  viewerEmail: string;
}): Promise<
  | { ok: true; deletedBookId: string }
  | { ok: false; code: string; message: string; status: number }
> {
  const eligibility = await loadDiaryBookDeleteEligibility(params);
  if (!eligibility.ok) {
    return {
      ok: false,
      code: eligibility.code,
      message: eligibility.message,
      status: 404,
    };
  }
  if (!eligibility.canDelete) {
    return {
      ok: false,
      code: eligibility.reason.code,
      message: eligibility.reason.message,
      status: 409,
    };
  }

  await prisma.diaryBook.delete({ where: { id: eligibility.book.id } });
  return { ok: true, deletedBookId: eligibility.book.id };
}
