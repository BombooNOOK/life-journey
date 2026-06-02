import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { journalEntryInBookshelfPeriod } from "@/lib/journal/bookshelfPeriod";
import { buildDiaryBindingCode } from "@/lib/order/diaryBindingCode";
import { getBookPlan, type BookPlanId } from "@/lib/order/bookBindingPlan";

const CODE_ASSIGN_MAX_ATTEMPTS = 8;

function isPrismaUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

export type CreateDiaryBookBindingRequestInput = {
  viewerEmail: string;
  profileId: string;
  year: number;
};

export type DiaryBookBindingSnapshot = {
  pageCount: number;
  planId: BookPlanId;
  displayTitle: string | null;
  periodStartMonth: number;
  periodEndMonth: number;
};

export type DiaryBookBindingPublic = {
  requestId: string;
  diaryBindingCode: string;
  baseShopUrl: string;
  pageCount: number;
  planId: BookPlanId;
};

function snapshotDiffersFromRow(
  snapshot: DiaryBookBindingSnapshot,
  row: {
    pageCount: number;
    planId: string;
    displayTitle: string | null;
    periodStartMonth: number | null;
    periodEndMonth: number | null;
  },
): boolean {
  return (
    row.pageCount !== snapshot.pageCount ||
    row.planId !== snapshot.planId ||
    (row.displayTitle ?? null) !== snapshot.displayTitle ||
    (row.periodStartMonth ?? 1) !== snapshot.periodStartMonth ||
    (row.periodEndMonth ?? 12) !== snapshot.periodEndMonth
  );
}

export async function loadDiaryBindingSnapshot(
  viewerEmail: string,
  profileId: string,
  year: number,
): Promise<DiaryBookBindingSnapshot | { error: string }> {
  const shelfRow = await prisma.diaryBookshelfBook.findUnique({
    where: {
      email_profileId_year: { email: viewerEmail, profileId, year },
    },
    select: {
      displayTitle: true,
      periodStartMonth: true,
      periodEndMonth: true,
    },
  });

  const periodStartMonth = shelfRow?.periodStartMonth ?? 1;
  const periodEndMonth = shelfRow?.periodEndMonth ?? 12;

  const entries = await prisma.journalEntry.findMany({
    where: { email: viewerEmail, profileId },
    select: { createdAt: true, includeInBook: true },
  });

  const pageCount = entries.filter(
    (entry) =>
      entry.includeInBook !== false &&
      journalEntryInBookshelfPeriod(entry.createdAt, year, periodStartMonth, periodEndMonth),
  ).length;

  if (pageCount <= 0) {
    return { error: "本に入れるページがありません。製本したい日記をONにしてください。" };
  }

  const plan = getBookPlan(pageCount);
  if (!plan.orderable) {
    return { error: plan.overLimitMessage ?? "製本できないページ数です。" };
  }

  return {
    pageCount,
    planId: plan.plan,
    displayTitle: shelfRow?.displayTitle?.trim() || null,
    periodStartMonth,
    periodEndMonth,
  };
}

async function syncPendingRow(
  pendingId: string,
  snapshot: DiaryBookBindingSnapshot,
  existing: {
    pageCount: number;
    planId: string;
    displayTitle: string | null;
    periodStartMonth: number | null;
    periodEndMonth: number | null;
    diaryBindingCode: string;
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
        periodStartMonth: snapshot.periodStartMonth,
        periodEndMonth: snapshot.periodEndMonth,
      },
    });
  }
  return { contentUpdated };
}

/**
 * 画面表示用: pending があれば現在の掲載内容に同期して返す。
 */
export async function getPendingDiaryBookBindingForYear(
  input: CreateDiaryBookBindingRequestInput,
): Promise<
  | { ok: true; pending: DiaryBookBindingPublic | null; contentUpdated: boolean }
  | { ok: false; error: string }
> {
  const snapshot = await loadDiaryBindingSnapshot(input.viewerEmail, input.profileId, input.year);
  if ("error" in snapshot) {
    return { ok: true, pending: null, contentUpdated: false };
  }

  const plan = getBookPlan(snapshot.pageCount);
  if (!plan.orderable || !plan.baseUrl) {
    return { ok: true, pending: null, contentUpdated: false };
  }

  const existing = await prisma.diaryBookBindingRequest.findFirst({
    where: {
      email: input.viewerEmail,
      profileId: input.profileId,
      year: input.year,
      status: "pending",
    },
    orderBy: { createdAt: "desc" },
  });

  if (!existing) {
    return { ok: true, pending: null, contentUpdated: false };
  }

  const { contentUpdated } = await syncPendingRow(existing.id, snapshot, existing);

  return {
    ok: true,
    pending: {
      requestId: existing.id,
      diaryBindingCode: existing.diaryBindingCode,
      baseShopUrl: plan.baseUrl,
      pageCount: snapshot.pageCount,
      planId: snapshot.planId,
    },
    contentUpdated,
  };
}

export async function createOrReusePendingDiaryBookBindingRequest(
  input: CreateDiaryBookBindingRequestInput,
) {
  const snapshot = await loadDiaryBindingSnapshot(input.viewerEmail, input.profileId, input.year);
  if ("error" in snapshot) {
    return { ok: false as const, error: snapshot.error };
  }

  const plan = getBookPlan(snapshot.pageCount);
  if (!plan.orderable || !plan.baseUrl) {
    return {
      ok: false as const,
      error: plan.overLimitMessage ?? "製本できないページ数です。",
    };
  }

  const existing = await prisma.diaryBookBindingRequest.findFirst({
    where: {
      email: input.viewerEmail,
      profileId: input.profileId,
      year: input.year,
      status: "pending",
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    const { contentUpdated } = await syncPendingRow(existing.id, snapshot, existing);

    return {
      ok: true as const,
      requestId: existing.id,
      diaryBindingCode: existing.diaryBindingCode,
      reused: true,
      contentUpdated,
      baseShopUrl: plan.baseUrl,
      pageCount: snapshot.pageCount,
      planId: snapshot.planId,
    };
  }

  const issuedAt = new Date();

  for (let attempt = 0; attempt < CODE_ASSIGN_MAX_ATTEMPTS; attempt++) {
    const diaryBindingCode = buildDiaryBindingCode(issuedAt);
    try {
      const created = await prisma.diaryBookBindingRequest.create({
        data: {
          email: input.viewerEmail,
          profileId: input.profileId,
          year: input.year,
          diaryBindingCode,
          status: "pending",
          pageCount: snapshot.pageCount,
          planId: snapshot.planId,
          displayTitle: snapshot.displayTitle,
          periodStartMonth: snapshot.periodStartMonth,
          periodEndMonth: snapshot.periodEndMonth,
        },
      });

      return {
        ok: true as const,
        requestId: created.id,
        diaryBindingCode: created.diaryBindingCode,
        reused: false,
        contentUpdated: false,
        baseShopUrl: plan.baseUrl,
        pageCount: snapshot.pageCount,
        planId: snapshot.planId,
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
