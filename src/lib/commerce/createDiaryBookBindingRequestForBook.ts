import { Prisma } from "@prisma/client";

import {
  expireStaleUnpaidPendingForScope,
  resolveActivePendingRequest,
} from "@/lib/commerce/diaryBookBindingPendingLifecycle";
import { prisma } from "@/lib/db";
import { countBoundDiaryBookTotalPages } from "@/lib/journal/diaryBookBindingOffer";
import {
  getAshiatoPageTemplate,
  normalizeAshiatoPageTemplateId,
  type AshiatoPageTemplateId,
} from "@/lib/journal/ashiatoPageTemplates";
import { listJournalEntriesForDiaryBookRow } from "@/lib/journal/listDiaryBookEntries";
import { buildDiaryBindingCode } from "@/lib/order/diaryBindingCode";
import { getBookPlan, type BookPlanId } from "@/lib/order/bookBindingPlan";

const CODE_ASSIGN_MAX_ATTEMPTS = 8;

function isPrismaUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

export type DiaryBookBindingForBookInput = {
  viewerEmail: string;
  bookId: string;
};

export type DiaryBookBindingBookSnapshot = {
  diaryBookId: string;
  email: string;
  profileId: string;
  displayTitle: string;
  startDate: string;
  endDate: string;
  pageCount: number;
  planId: BookPlanId;
  baseShopUrl: string;
  pageTemplate: AshiatoPageTemplateId;
  pageTemplateLabel: string;
};

export type DiaryBookBindingForBookPublic = {
  requestId: string;
  diaryBindingCode: string;
  baseShopUrl: string;
  pageCount: number;
  planId: BookPlanId;
  displayTitle: string;
  startDate: string;
  endDate: string;
};

function snapshotDiffersFromRow(
  snapshot: DiaryBookBindingBookSnapshot,
  row: {
    pageCount: number;
    planId: string;
    displayTitle: string | null;
    startDate: string | null;
    endDate: string | null;
    baseShopUrl: string | null;
  },
): boolean {
  return (
    row.pageCount !== snapshot.pageCount ||
    row.planId !== snapshot.planId ||
    (row.displayTitle ?? null) !== snapshot.displayTitle ||
    row.startDate !== snapshot.startDate ||
    row.endDate !== snapshot.endDate ||
    row.baseShopUrl !== snapshot.baseShopUrl
  );
}

export async function loadDiaryBookBindingSnapshotForBook(
  input: DiaryBookBindingForBookInput,
): Promise<DiaryBookBindingBookSnapshot | { error: string }> {
  const row = await prisma.diaryBook.findFirst({
    where: { id: input.bookId.trim(), email: input.viewerEmail },
  });
  if (!row) {
    return { error: "あしあとブックが見つかりません。" };
  }

  const entries = await listJournalEntriesForDiaryBookRow({
    book: row,
    viewerEmail: input.viewerEmail,
    respectSnapshot: false,
  });

  const pageCount = countBoundDiaryBookTotalPages(entries, row.startDate, row.endDate);
  if (pageCount <= 0) {
    return { error: "製本するページがありません。期間内にあしあとがあるか確認してください。" };
  }

  const plan = getBookPlan(pageCount);
  if (!plan.orderable || !plan.baseUrl) {
    return {
      error: plan.overLimitMessage ?? "ページ数が多いため、個別相談が必要です",
    };
  }

  const pageTemplate = normalizeAshiatoPageTemplateId(row.pageTemplate);
  const pageTemplateDef = getAshiatoPageTemplate(pageTemplate);

  return {
    diaryBookId: row.id,
    email: row.email,
    profileId: row.profileId,
    displayTitle: row.title.trim(),
    startDate: row.startDate,
    endDate: row.endDate,
    pageCount,
    planId: plan.plan,
    baseShopUrl: plan.baseUrl,
    pageTemplate,
    pageTemplateLabel: pageTemplateDef.label,
  };
}

async function syncPendingBookRow(
  pendingId: string,
  snapshot: DiaryBookBindingBookSnapshot,
  existing: {
    pageCount: number;
    planId: string;
    displayTitle: string | null;
    startDate: string | null;
    endDate: string | null;
    baseShopUrl: string | null;
  },
): Promise<{ contentUpdated: boolean }> {
  const contentUpdated = snapshotDiffersFromRow(snapshot, existing);
  if (contentUpdated) {
    await prisma.diaryBookBindingRequest.update({
      where: { id: pendingId },
      data: {
        pageCount: snapshot.pageCount,
        planId: snapshot.planId,
        displayTitle: snapshot.displayTitle,
        startDate: snapshot.startDate,
        endDate: snapshot.endDate,
        baseShopUrl: snapshot.baseShopUrl,
        year: parseInt(snapshot.startDate.slice(0, 4), 10) || null,
      },
    });
  }
  return { contentUpdated };
}

function toPublic(
  requestId: string,
  diaryBindingCode: string,
  snapshot: DiaryBookBindingBookSnapshot,
): DiaryBookBindingForBookPublic {
  return {
    requestId,
    diaryBindingCode,
    baseShopUrl: snapshot.baseShopUrl,
    pageCount: snapshot.pageCount,
    planId: snapshot.planId,
    displayTitle: snapshot.displayTitle,
    startDate: snapshot.startDate,
    endDate: snapshot.endDate,
  };
}

export async function getPendingDiaryBookBindingForBook(
  input: DiaryBookBindingForBookInput,
): Promise<
  | { ok: true; pending: DiaryBookBindingForBookPublic | null; contentUpdated: boolean }
  | { ok: false; error: string }
> {
  const snapshot = await loadDiaryBookBindingSnapshotForBook(input);
  if ("error" in snapshot) {
    return { ok: true, pending: null, contentUpdated: false };
  }

  const scope = {
    email: snapshot.email,
    profileId: snapshot.profileId,
    diaryBookId: snapshot.diaryBookId,
  };
  await expireStaleUnpaidPendingForScope(scope);

  const existing = await resolveActivePendingRequest(
    await prisma.diaryBookBindingRequest.findFirst({
      where: { ...scope, status: "pending" },
      orderBy: { createdAt: "desc" },
    }),
  );

  if (!existing) {
    return { ok: true, pending: null, contentUpdated: false };
  }

  const { contentUpdated } = await syncPendingBookRow(existing.id, snapshot, existing);

  return {
    ok: true,
    pending: toPublic(existing.id, existing.diaryBindingCode, snapshot),
    contentUpdated,
  };
}

export async function createOrReusePendingDiaryBookBindingForBook(
  input: DiaryBookBindingForBookInput,
) {
  const snapshot = await loadDiaryBookBindingSnapshotForBook(input);
  if ("error" in snapshot) {
    return { ok: false as const, error: snapshot.error };
  }

  const scope = {
    email: snapshot.email,
    profileId: snapshot.profileId,
    diaryBookId: snapshot.diaryBookId,
  };
  await expireStaleUnpaidPendingForScope(scope);

  const existing = await resolveActivePendingRequest(
    await prisma.diaryBookBindingRequest.findFirst({
      where: { ...scope, status: "pending" },
      orderBy: { createdAt: "desc" },
    }),
  );

  if (existing) {
    const { contentUpdated } = await syncPendingBookRow(existing.id, snapshot, existing);
    return {
      ok: true as const,
      ...toPublic(existing.id, existing.diaryBindingCode, snapshot),
      reused: true,
      contentUpdated,
    };
  }

  const issuedAt = new Date();
  const yearFromStart = parseInt(snapshot.startDate.slice(0, 4), 10);

  for (let attempt = 0; attempt < CODE_ASSIGN_MAX_ATTEMPTS; attempt++) {
    const diaryBindingCode = buildDiaryBindingCode(issuedAt);
    try {
      const created = await prisma.diaryBookBindingRequest.create({
        data: {
          email: snapshot.email,
          profileId: snapshot.profileId,
          diaryBookId: snapshot.diaryBookId,
          year: Number.isFinite(yearFromStart) ? yearFromStart : null,
          diaryBindingCode,
          status: "pending",
          pageCount: snapshot.pageCount,
          planId: snapshot.planId,
          displayTitle: snapshot.displayTitle,
          startDate: snapshot.startDate,
          endDate: snapshot.endDate,
          baseShopUrl: snapshot.baseShopUrl,
        },
      });

      return {
        ok: true as const,
        ...toPublic(created.id, created.diaryBindingCode, snapshot),
        reused: false,
        contentUpdated: false,
      };
    } catch (err) {
      if (!isPrismaUniqueViolation(err)) {
        throw err;
      }
    }
  }

  return {
    ok: false as const,
    error: "製本申込コードの発行に失敗しました。しばらくしてからお試しください。",
  };
}
