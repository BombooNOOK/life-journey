import type { Prisma } from "@prisma/client";

import { normalizeEmail } from "@/lib/auth/viewer";
import {
  expireStaleUnpaidPendingForScope,
  hasBaseOrderNumber,
  isStaleUnpaidPending,
} from "@/lib/commerce/diaryBookBindingPendingLifecycle";
import { DIARY_BOOK_BINDING_STATUS_LABELS } from "@/lib/commerce/diaryBookBindingStatus";
import { KANTEI_BOOK_BINDING_STATUS_LABELS } from "@/lib/commerce/kanteiBookBindingStatus";
import { prisma } from "@/lib/db";
import { deleteJournalEntryPhotoBlobWithResult } from "@/lib/journal/journalEntryPhotoBlob";
import {
  ADMIN_PROFILE_DELETE_CONFIRMATION_KEYS,
  ADMIN_PROFILE_DELETE_CONFIRMATION_WORD,
  type AdminProfileDeleteBindingBlockDetail,
  type AdminProfileDeleteConfirmations,
  type AdminProfileDeleteDiaryBindingSummary,
  type AdminProfileDeleteKanteiBindingSummary,
  type AdminProfileDeleteOrderSummary,
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

export type ProfileDeleteDiaryBindingRow = {
  id: string;
  diaryBookId: string | null;
  profileId: string;
  status: string;
  baseOrderNumber: string | null;
  cancelledAt: Date | null;
  expiredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  diaryBindingCode: string;
};

export type ProfileDeleteKanteiBindingRow = {
  id: string;
  orderId: string;
  profileId: string;
  status: string;
  baseOrderNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
  kanteiCode: string;
};

export type ProfileDeleteBlockReason = {
  code: string;
  message: string;
  orderCount?: number;
  blockingDiaryBinding: AdminProfileDeleteBindingBlockDetail | null;
  blockingKanteiBinding: AdminProfileDeleteBindingBlockDetail | null;
};

function diaryStatusLabel(status: string): string {
  return DIARY_BOOK_BINDING_STATUS_LABELS[status as keyof typeof DIARY_BOOK_BINDING_STATUS_LABELS] ?? status;
}

function kanteiStatusLabel(status: string): string {
  return KANTEI_BOOK_BINDING_STATUS_LABELS[status as keyof typeof KANTEI_BOOK_BINDING_STATUS_LABELS] ?? status;
}

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

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

function diaryBindingScopeWhere(
  email: string,
  profileId: string,
  diaryBookIds: string[],
): Prisma.DiaryBookBindingRequestWhereInput {
  return {
    email,
    OR: [{ profileId }, ...(diaryBookIds.length > 0 ? [{ diaryBookId: { in: diaryBookIds } }] : [])],
  };
}

function buildDiaryBlockDetail(
  row: ProfileDeleteDiaryBindingRow,
  blockSubCode: string,
  blockMessage: string,
  actionHint: string,
): AdminProfileDeleteBindingBlockDetail {
  return {
    kind: "diary",
    requestId: row.id,
    code: row.diaryBindingCode,
    status: row.status,
    statusLabel: diaryStatusLabel(row.status),
    baseOrderNumber: row.baseOrderNumber,
    hasBaseOrderNumber: hasBaseOrderNumber(row.baseOrderNumber),
    diaryBookId: row.diaryBookId,
    bindingProfileId: row.profileId,
    cancelledAt: toIso(row.cancelledAt),
    expiredAt: toIso(row.expiredAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    blockSubCode,
    blockMessage,
    actionHint,
  };
}

function buildKanteiBlockDetail(
  row: ProfileDeleteKanteiBindingRow,
  blockSubCode: string,
  blockMessage: string,
  actionHint: string,
): AdminProfileDeleteBindingBlockDetail {
  return {
    kind: "kantei",
    requestId: row.id,
    code: row.kanteiCode,
    status: row.status,
    statusLabel: kanteiStatusLabel(row.status),
    baseOrderNumber: row.baseOrderNumber,
    hasBaseOrderNumber: hasBaseOrderNumber(row.baseOrderNumber),
    orderId: row.orderId,
    bindingProfileId: row.profileId,
    cancelledAt: null,
    expiredAt: null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    blockSubCode,
    blockMessage,
    actionHint,
  };
}

/** プロフィール削除専用の日記製本ブロック判定（cancelled/expired は原則ブロックしない） */
export function findProfileDeleteBlockingDiaryBinding(
  rows: ProfileDeleteDiaryBindingRow[],
  now = new Date(),
): AdminProfileDeleteBindingBlockDetail | null {
  for (const row of rows) {
    const code = row.diaryBindingCode;
    const base = row.baseOrderNumber;

    if (row.status === "ordered" || row.status === "in_production" || row.status === "shipped") {
      const statusLabel = diaryStatusLabel(row.status);
      return buildDiaryBlockDetail(
        row,
        row.status === "ordered" ? "BINDING_ORDERED" : "BINDING_IN_PROGRESS",
        `日記ブック製本申込（${code}）は${statusLabel}のため、このプロフィールは削除できません。`,
        "実注文・製本処理中の申込は削除できません。",
      );
    }

    if (row.status === "cancelled") {
      if (hasBaseOrderNumber(base)) {
        return buildDiaryBlockDetail(
          row,
          "BINDING_CANCELLED_WITH_BASE_ORDER",
          `日記ブック製本申込（${code}）は取り下げ済みですが、BASE注文番号があるため削除できません。`,
          "BASE注文番号を確認し、実注文に関わらないことを確認してください。",
        );
      }
      continue;
    }

    if (row.status === "expired") {
      if (hasBaseOrderNumber(base)) {
        return buildDiaryBlockDetail(
          row,
          "BINDING_EXPIRED_WITH_BASE_ORDER",
          `日記ブック製本申込（${code}）は期限切れですが、BASE注文番号があるため削除できません。`,
          "BASE注文番号を確認し、実注文に関わらないことを確認してください。",
        );
      }
      continue;
    }

    if (row.status !== "pending") continue;

    if (hasBaseOrderNumber(base)) {
      return buildDiaryBlockDetail(
        row,
        "BINDING_PENDING_WITH_BASE_ORDER",
        `有効な日記ブック製本申込（${code}）があります。BASE注文番号が登録済みです。`,
        "管理者の日記製本申込画面で状況を確認してください。",
      );
    }

    if (!isStaleUnpaidPending(row, now)) {
      return buildDiaryBlockDetail(
        row,
        "BINDING_PENDING_ACTIVE",
        `有効な日記ブック製本申込（${code}）があります。`,
        "管理者の日記製本申込画面（/admin/diary-book-binding）で取り下げてください。",
      );
    }
  }

  return null;
}

/** プロフィール削除専用の鑑定書製本ブロック判定 */
export function findProfileDeleteBlockingKanteiBinding(
  rows: ProfileDeleteKanteiBindingRow[],
): AdminProfileDeleteBindingBlockDetail | null {
  for (const row of rows) {
    const code = row.kanteiCode;
    const base = row.baseOrderNumber;

    if (row.status === "ordered" || row.status === "in_production" || row.status === "shipped") {
      const statusLabel = kanteiStatusLabel(row.status);
      return buildKanteiBlockDetail(
        row,
        row.status === "ordered" ? "BINDING_ORDERED" : "BINDING_IN_PROGRESS",
        `鑑定書製本申込（${code}）は${statusLabel}のため、このプロフィールは削除できません。`,
        "実注文・製本処理中の申込は削除できません。",
      );
    }

    if (row.status === "cancelled") {
      if (hasBaseOrderNumber(base)) {
        return buildKanteiBlockDetail(
          row,
          "BINDING_CANCELLED_WITH_BASE_ORDER",
          `鑑定書製本申込（${code}）は取り下げ済みですが、BASE注文番号があるため削除できません。`,
          "BASE注文番号を確認し、実注文に関わらないことを確認してください。",
        );
      }
      continue;
    }

    if (row.status !== "pending") continue;

    if (hasBaseOrderNumber(base)) {
      return buildKanteiBlockDetail(
        row,
        "BINDING_PENDING_WITH_BASE_ORDER",
        `有効な鑑定書製本申込（${code}）があります。BASE注文番号が登録済みです。`,
        "管理者の鑑定書製本申込画面で状況を確認してください。",
      );
    }

    return buildKanteiBlockDetail(
      row,
      "BINDING_PENDING_ACTIVE",
      `有効な鑑定書製本申込（${code}）があります。`,
      "鑑定書製本申込のステータスを確認してください。",
    );
  }

  return null;
}

/** @deprecated テスト互換の薄いラッパー */
export function findBlockingKanteiBookBindingRequest(
  rows: Array<{ id: string; status: string; baseOrderNumber: string | null; kanteiCode: string }>,
): { code: string; message: string } | null {
  const block = findProfileDeleteBlockingKanteiBinding(
    rows.map((row) => ({
      ...row,
      orderId: "",
      profileId: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  );
  if (!block) return null;
  return { code: "KANTEI_BINDING_BLOCKED", message: block.blockMessage };
}

export function evaluateProfileDeleteEligibility(params: {
  orderCount: number;
  diaryBindings: ProfileDeleteDiaryBindingRow[];
  kanteiBindings: ProfileDeleteKanteiBindingRow[];
  now?: Date;
}): ProfileDeleteBlockReason | null {
  if (params.orderCount > 0) {
    return {
      code: "ORDER_EXISTS",
      message: `このプロフィールには鑑定作成データ（Order）が ${params.orderCount} 件あります。鑑定書そのものに紐づくデータが残っているため、現在は削除できません。※鑑定書の製本申込（KanteiBookBindingRequest）とは別のデータです。`,
      orderCount: params.orderCount,
      blockingDiaryBinding: null,
      blockingKanteiBinding: null,
    };
  }

  const blockingDiaryBinding = findProfileDeleteBlockingDiaryBinding(params.diaryBindings, params.now);
  if (blockingDiaryBinding) {
    return {
      code: "DIARY_BINDING_BLOCKED",
      message: blockingDiaryBinding.blockMessage,
      blockingDiaryBinding,
      blockingKanteiBinding: null,
    };
  }

  const blockingKanteiBinding = findProfileDeleteBlockingKanteiBinding(params.kanteiBindings);
  if (blockingKanteiBinding) {
    return {
      code: "KANTEI_BINDING_BLOCKED",
      message: blockingKanteiBinding.blockMessage,
      blockingDiaryBinding: null,
      blockingKanteiBinding,
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

async function loadDiaryBookIdsForProfile(email: string, profileId: string): Promise<string[]> {
  const diaryBooks = await prisma.diaryBook.findMany({
    where: profileScopeWhere(email, profileId),
    select: { id: true },
  });
  return diaryBooks.map((row) => row.id);
}

async function loadDiaryBindingsForProfileDelete(
  email: string,
  profileId: string,
): Promise<ProfileDeleteDiaryBindingRow[]> {
  const diaryBookIds = await loadDiaryBookIdsForProfile(email, profileId);
  const rows = await prisma.diaryBookBindingRequest.findMany({
    where: diaryBindingScopeWhere(email, profileId, diaryBookIds),
    select: {
      id: true,
      diaryBookId: true,
      profileId: true,
      status: true,
      baseOrderNumber: true,
      cancelledAt: true,
      expiredAt: true,
      createdAt: true,
      updatedAt: true,
      diaryBindingCode: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

function mapDiaryBindingSummary(row: ProfileDeleteDiaryBindingRow): AdminProfileDeleteDiaryBindingSummary {
  return {
    id: row.id,
    diaryBookId: row.diaryBookId,
    bindingProfileId: row.profileId,
    diaryBindingCode: row.diaryBindingCode,
    status: row.status,
    baseOrderNumber: row.baseOrderNumber,
    cancelledAt: toIso(row.cancelledAt),
    expiredAt: toIso(row.expiredAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapOrderSummary(row: {
  id: string;
  kanteiCode: string | null;
  profileId: string;
  email: string;
  fullNameDisplay: string;
  birthDate: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  pdfPreviewBlobUrl: string | null;
  pdfPrintBlobUrl: string | null;
  numerologyJson: string;
}): AdminProfileDeleteOrderSummary {
  return {
    id: row.id,
    kanteiCode: row.kanteiCode,
    profileId: row.profileId,
    email: row.email,
    fullNameDisplay: row.fullNameDisplay,
    birthDate: row.birthDate,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    hasPdfPreviewBlob: Boolean(row.pdfPreviewBlobUrl?.trim()),
    hasPdfPrintBlob: Boolean(row.pdfPrintBlobUrl?.trim()),
    hasNumerologyJson: Boolean(row.numerologyJson?.trim()),
  };
}

function mapKanteiBindingSummary(row: ProfileDeleteKanteiBindingRow): AdminProfileDeleteKanteiBindingSummary {
  return {
    id: row.id,
    orderId: row.orderId,
    bindingProfileId: row.profileId,
    kanteiCode: row.kanteiCode,
    status: row.status,
    baseOrderNumber: row.baseOrderNumber,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function loadProfileDeleteCounts(email: string, profileId: string) {
  const scope = profileScopeWhere(email, profileId);
  const [
    journalEntryCount,
    photoCount,
    diaryBookCount,
    bookshelfBookCount,
    orders,
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
    prisma.order.findMany({
      where: scope,
      select: {
        id: true,
        kanteiCode: true,
        profileId: true,
        email: true,
        fullNameDisplay: true,
        birthDate: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        pdfPreviewBlobUrl: true,
        pdfPrintBlobUrl: true,
        numerologyJson: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    loadDiaryBindingsForProfileDelete(email, profileId),
    prisma.kanteiBookBindingRequest.findMany({
      where: scope,
      select: {
        id: true,
        orderId: true,
        profileId: true,
        status: true,
        baseOrderNumber: true,
        createdAt: true,
        updatedAt: true,
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
    orders,
    orderCount: orders.length,
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
    select: { id: true, nickname: true, createdAt: true, updatedAt: true },
  });
  if (!profile) {
    throw new AdminProfileDeleteError("指定プロフィールが見つかりません。", "PROFILE_NOT_FOUND");
  }

  const diaryBookIds = await loadDiaryBookIdsForProfile(email, profileId);
  await expireStaleUnpaidPendingForScope(diaryBindingScopeWhere(email, profileId, diaryBookIds));
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
    profileCreatedAt: profile.createdAt.toISOString(),
    profileUpdatedAt: profile.updatedAt.toISOString(),
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
    blockingDiaryBinding: block?.blockingDiaryBinding ?? null,
    blockingKanteiBinding: block?.blockingKanteiBinding ?? null,
    orders: counts.orders.map(mapOrderSummary),
    diaryBindings: counts.diaryBindings.map(mapDiaryBindingSummary),
    kanteiBindings: counts.kanteiBindings.map(mapKanteiBindingSummary),
  };
}

function deletableDiaryBindingIds(rows: ProfileDeleteDiaryBindingRow[], now = new Date()): string[] {
  return rows
    .filter((row) => {
      if (row.status === "cancelled" || row.status === "expired") {
        return !hasBaseOrderNumber(row.baseOrderNumber);
      }
      if (row.status === "pending" && isStaleUnpaidPending(row, now) && !hasBaseOrderNumber(row.baseOrderNumber)) {
        return true;
      }
      return false;
    })
    .map((row) => row.id);
}

function deletableKanteiBindingIds(rows: ProfileDeleteKanteiBindingRow[]): string[] {
  return rows
    .filter((row) => row.status === "cancelled" && !hasBaseOrderNumber(row.baseOrderNumber))
    .map((row) => row.id);
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
    loadDiaryBindingsForProfileDelete(email, profileId),
    prisma.kanteiBookBindingRequest.findMany({
      where: scope,
      select: {
        id: true,
        orderId: true,
        profileId: true,
        status: true,
        baseOrderNumber: true,
        createdAt: true,
        updatedAt: true,
        kanteiCode: true,
      },
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
