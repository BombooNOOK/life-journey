import { normalizeEmail } from "@/lib/auth/viewer";
import { hasBaseOrderNumber } from "@/lib/commerce/diaryBookBindingPendingLifecycle";
import { KANTEI_BOOK_BINDING_STATUS_LABELS } from "@/lib/commerce/kanteiBookBindingStatus";
import { prisma } from "@/lib/db";
import {
  expireStaleUnpaidPendingForScope,
  isStaleUnpaidPending,
} from "@/lib/commerce/diaryBookBindingPendingLifecycle";
import {
  findBlockingDiaryBookBindingRequest,
  type DiaryBookBindingBlockRow,
} from "@/lib/journal/deleteDiaryBook";
import { deleteJournalEntryPhotoBlobWithResult } from "@/lib/journal/journalEntryPhotoBlob";
import {
  ADMIN_PROFILE_DELETE_CONFIRMATION_KEYS,
  ADMIN_PROFILE_DELETE_CONFIRMATION_WORD,
  type AdminProfileDeleteConfirmations,
  type AdminProfileDeletePreview,
  type AdminProfileDeleteResult,
  type AdminProfileListItem,
} from "@/lib/profile/adminProfileDeleteTypes";

export class AdminProfileDeleteError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "AdminProfileDeleteError";
  }
}

export type KanteiBindingBlockRow = {
  id: string;
  status: string;
  baseOrderNumber: string | null;
  kanteiCode: string;
};

export type ProfileDeleteBlockReason =
  | { code: "ORDER_EXISTS"; message: string; orderCount: number }
  | { code: "DIARY_BINDING_BLOCKED"; message: string }
  | { code: "KANTEI_BINDING_BLOCKED"; message: string };

export function assertDeletableProfileId(profileId: string): string {
  const trimmed = profileId.trim();
  if (!trimmed) {
    throw new AdminProfileDeleteError("プロフィールIDが空です。", "INVALID_PROFILE_ID");
  }
  return trimmed;
}

export function parseAdminProfileDeleteTargetEmail(raw: unknown): string {
  const email = normalizeEmail(typeof raw === "string" ? raw : "");
  if (!email) {
    throw new AdminProfileDeleteError("対象ユーザーのメールアドレスを入力してください。", "EMAIL_MISSING");
  }
  return email;
}

export function parseAdminProfileDeleteConfirmations(raw: unknown): AdminProfileDeleteConfirmations {
  if (typeof raw !== "object" || raw === null) {
    throw new AdminProfileDeleteError("確認チェックが不正です。", "INVALID_CONFIRMATIONS");
  }
  const obj = raw as Record<string, unknown>;
  const confirmations = {} as AdminProfileDeleteConfirmations;
  for (const key of ADMIN_PROFILE_DELETE_CONFIRMATION_KEYS) {
    confirmations[key] = obj[key] === true;
  }
  const missing = ADMIN_PROFILE_DELETE_CONFIRMATION_KEYS.filter((key) => !confirmations[key]);
  if (missing.length > 0) {
    throw new AdminProfileDeleteError("削除前の確認チェックをすべて入れてください。", "CONFIRMATIONS_REQUIRED");
  }
  return confirmations;
}

export function parseAdminProfileDeleteConfirmationWord(raw: unknown): void {
  const word = typeof raw === "string" ? raw.trim() : "";
  if (word !== ADMIN_PROFILE_DELETE_CONFIRMATION_WORD) {
    throw new AdminProfileDeleteError(
      `確認ワードに「${ADMIN_PROFILE_DELETE_CONFIRMATION_WORD}」と入力してください。`,
      "CONFIRMATION_WORD_MISMATCH",
    );
  }
}

function profileScopeWhere(email: string, profileId: string) {
  return { email, profileId };
}

export function findBlockingKanteiBookBindingRequest(
  rows: KanteiBindingBlockRow[],
): { code: string; message: string } | null {
  for (const row of rows) {
    if (row.status === "ordered" || row.status === "in_production" || row.status === "shipped") {
      const statusLabel =
        KANTEI_BOOK_BINDING_STATUS_LABELS[
          row.status as keyof typeof KANTEI_BOOK_BINDING_STATUS_LABELS
        ] ?? row.status;
      return {
        code: "KANTEI_BINDING_BLOCKED",
        message: `鑑定書製本申込（${row.kanteiCode}）は${statusLabel}のため、このプロフィールは削除できません。`,
      };
    }
    if (row.status !== "pending") continue;
    if (hasBaseOrderNumber(row.baseOrderNumber)) {
      return {
        code: "KANTEI_BINDING_BLOCKED",
        message: `鑑定書製本申込（${row.kanteiCode}）は決済情報が登録済みのため、このプロフィールは削除できません。`,
      };
    }
    return {
      code: "KANTEI_BINDING_BLOCKED",
      message: `鑑定書製本申込予定（${row.kanteiCode}）が有効です。先に取り下げてください。`,
    };
  }
  return null;
}

export function evaluateProfileDeleteEligibility(params: {
  orderCount: number;
  diaryBindings: DiaryBookBindingBlockRow[];
  kanteiBindings: KanteiBindingBlockRow[];
  now?: Date;
}): ProfileDeleteBlockReason | null {
  if (params.orderCount > 0) {
    return {
      code: "ORDER_EXISTS",
      message: `このプロフィールには鑑定書（Order）が ${params.orderCount} 件あるため、削除できません。`,
      orderCount: params.orderCount,
    };
  }

  const diaryBlock = findBlockingDiaryBookBindingRequest(params.diaryBindings, params.now);
  if (diaryBlock) {
    return {
      code: "DIARY_BINDING_BLOCKED",
      message: diaryBlock.message,
    };
  }

  const kanteiBlock = findBlockingKanteiBookBindingRequest(params.kanteiBindings);
  if (kanteiBlock) {
    return {
      code: "KANTEI_BINDING_BLOCKED",
      message: kanteiBlock.message,
    };
  }

  return null;
}

export async function listAdminProfilesForEmail(email: string): Promise<AdminProfileListItem[]> {
  const rows = await prisma.profile.findMany({
    where: { email, isArchived: false },
    orderBy: { createdAt: "asc" },
    select: { id: true, nickname: true, createdAt: true },
  });
  return rows.map((row) => ({
    id: row.id,
    nickname: row.nickname,
    createdAt: row.createdAt.toISOString(),
  }));
}

async function loadProfileDeleteCounts(email: string, profileId: string) {
  const scope = profileScopeWhere(email, profileId);
  const [
    journalEntryCount,
    photoCount,
    diaryBookCount,
    bookshelfBookCount,
    orderCount,
    diaryBindings,
    kanteiBindings,
  ] = await Promise.all([
    prisma.journalEntry.count({ where: scope }),
    prisma.journalEntry.count({
      where: {
        ...scope,
        OR: [{ photoBlobPathname: { not: null } }, { photoBlobUrl: { not: null } }],
      },
    }),
    prisma.diaryBook.count({ where: scope }),
    prisma.diaryBookshelfBook.count({ where: scope }),
    prisma.order.count({ where: scope }),
    prisma.diaryBookBindingRequest.findMany({
      where: scope,
      select: {
        id: true,
        status: true,
        baseOrderNumber: true,
        createdAt: true,
        diaryBindingCode: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.kanteiBookBindingRequest.findMany({
      where: scope,
      select: {
        id: true,
        status: true,
        baseOrderNumber: true,
        kanteiCode: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const hasAnyBaseOrderNumber =
    diaryBindings.some((row) => hasBaseOrderNumber(row.baseOrderNumber)) ||
    kanteiBindings.some((row) => hasBaseOrderNumber(row.baseOrderNumber));

  return {
    journalEntryCount,
    photoCount,
    diaryBookCount,
    bookshelfBookCount,
    orderCount,
    diaryBindingCount: diaryBindings.length,
    kanteiBindingCount: kanteiBindings.length,
    hasBaseOrderNumber: hasAnyBaseOrderNumber,
    diaryBindings,
    kanteiBindings,
  };
}

export async function buildAdminProfileDeletePreview(params: {
  targetEmail: string;
  profileId: string;
}): Promise<AdminProfileDeletePreview> {
  const email = parseAdminProfileDeleteTargetEmail(params.targetEmail);
  const profileId = assertDeletableProfileId(params.profileId);

  const profile = await prisma.profile.findFirst({
    where: { id: profileId, email, isArchived: false },
    select: { id: true, nickname: true },
  });
  if (!profile) {
    throw new AdminProfileDeleteError("指定プロフィールが見つかりません。", "PROFILE_NOT_FOUND");
  }

  await expireStaleUnpaidPendingForScope(profileScopeWhere(email, profileId));
  const counts = await loadProfileDeleteCounts(email, profileId);
  const block = evaluateProfileDeleteEligibility({
    orderCount: counts.orderCount,
    diaryBindings: counts.diaryBindings,
    kanteiBindings: counts.kanteiBindings,
  });

  return {
    targetEmail: email,
    profileId: profile.id,
    profileNickname: profile.nickname,
    journalEntryCount: counts.journalEntryCount,
    photoCount: counts.photoCount,
    diaryBookCount: counts.diaryBookCount,
    bookshelfBookCount: counts.bookshelfBookCount,
    orderCount: counts.orderCount,
    diaryBindingCount: counts.diaryBindingCount,
    kanteiBindingCount: counts.kanteiBindingCount,
    hasBaseOrderNumber: counts.hasBaseOrderNumber,
    canDelete: block == null,
    blockCode: block?.code ?? null,
    blockMessage: block?.message ?? null,
  };
}

function deletableDiaryBindingIds(rows: DiaryBookBindingBlockRow[], now = new Date()): string[] {
  return rows
    .filter((row) => {
      if (row.status === "cancelled" || row.status === "expired") return true;
      if (row.status === "pending" && isStaleUnpaidPending(row, now) && !hasBaseOrderNumber(row.baseOrderNumber)) {
        return true;
      }
      return false;
    })
    .map((row) => row.id);
}

function deletableKanteiBindingIds(rows: KanteiBindingBlockRow[]): string[] {
  return rows.filter((row) => row.status === "cancelled").map((row) => row.id);
}

export async function deleteAdminProfileForUser(params: {
  targetEmail: string;
  profileId: string;
}): Promise<AdminProfileDeleteResult> {
  const preview = await buildAdminProfileDeletePreview(params);
  if (!preview.canDelete) {
    throw new AdminProfileDeleteError(
      preview.blockMessage ?? "このプロフィールは削除できません。",
      preview.blockCode ?? "DELETE_BLOCKED",
    );
  }

  const email = preview.targetEmail;
  const profileId = preview.profileId;
  const scope = profileScopeWhere(email, profileId);

  const [entries, diaryBindings, kanteiBindings] = await Promise.all([
    prisma.journalEntry.findMany({
      where: scope,
      select: { photoBlobPathname: true, photoBlobUrl: true },
    }),
    prisma.diaryBookBindingRequest.findMany({
      where: scope,
      select: {
        id: true,
        status: true,
        baseOrderNumber: true,
        createdAt: true,
        diaryBindingCode: true,
      },
    }),
    prisma.kanteiBookBindingRequest.findMany({
      where: scope,
      select: { id: true, status: true, baseOrderNumber: true, kanteiCode: true },
    }),
  ]);

  const diaryBindingIds = deletableDiaryBindingIds(diaryBindings);
  const kanteiBindingIds = deletableKanteiBindingIds(kanteiBindings);

  const deleted = await prisma.$transaction(async (tx) => {
    const deletedDiaryBindings = await tx.diaryBookBindingRequest.deleteMany({
      where: { id: { in: diaryBindingIds } },
    });
    const deletedKanteiBindings = await tx.kanteiBookBindingRequest.deleteMany({
      where: { id: { in: kanteiBindingIds } },
    });
    const deletedDiaryBooks = await tx.diaryBook.deleteMany({ where: scope });
    const deletedBookshelfBooks = await tx.diaryBookshelfBook.deleteMany({ where: scope });
    const deletedJournalEntries = await tx.journalEntry.deleteMany({ where: scope });
    await tx.profile.delete({ where: { id: profileId } });

    return {
      deletedDiaryBindings: deletedDiaryBindings.count,
      deletedKanteiBindings: deletedKanteiBindings.count,
      deletedDiaryBooks: deletedDiaryBooks.count,
      deletedBookshelfBooks: deletedBookshelfBooks.count,
      deletedJournalEntries: deletedJournalEntries.count,
    };
  });

  let deletedPhotoBlobCount = 0;
  let failedPhotoBlobCount = 0;
  const photoBlobWarnings: string[] = [];

  for (const entry of entries) {
    const pathname = entry.photoBlobPathname?.trim();
    const blobUrl = entry.photoBlobUrl?.trim();
    if (!pathname && !blobUrl) continue;

    const result = await deleteJournalEntryPhotoBlobWithResult(pathname, blobUrl);
    if (result.ok) {
      deletedPhotoBlobCount += 1;
    } else {
      failedPhotoBlobCount += 1;
      photoBlobWarnings.push(result.warning);
    }
  }

  console.info("[admin-profile-delete] ok", {
    targetEmail: email,
    profileId,
    deletedJournalEntryCount: deleted.deletedJournalEntries,
    deletedPhotoBlobCount,
    failedPhotoBlobCount,
  });

  return {
    targetEmail: email,
    profileId,
    profileNickname: preview.profileNickname,
    deletedJournalEntryCount: deleted.deletedJournalEntries,
    deletedPhotoBlobCount,
    failedPhotoBlobCount,
    deletedDiaryBookCount: deleted.deletedDiaryBooks,
    deletedBookshelfBookCount: deleted.deletedBookshelfBooks,
    deletedDiaryBindingCount: deleted.deletedDiaryBindings,
    deletedKanteiBindingCount: deleted.deletedKanteiBindings,
    photoBlobWarnings,
  };
}

