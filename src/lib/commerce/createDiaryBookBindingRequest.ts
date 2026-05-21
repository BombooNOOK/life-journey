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

async function loadDiaryBindingSnapshot(
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

  return {
    pageCount,
    planId: plan.plan,
    displayTitle: shelfRow?.displayTitle?.trim() || null,
    periodStartMonth,
    periodEndMonth,
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
    await prisma.diaryBookBindingRequest.update({
      where: { id: existing.id },
      data: {
        pageCount: snapshot.pageCount,
        planId: snapshot.planId,
        displayTitle: snapshot.displayTitle,
        periodStartMonth: snapshot.periodStartMonth,
        periodEndMonth: snapshot.periodEndMonth,
      },
    });

    return {
      ok: true as const,
      requestId: existing.id,
      diaryBindingCode: existing.diaryBindingCode,
      reused: true,
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
