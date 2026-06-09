import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";

/** 初回日記作成成功後に呼ぶ。必ずサーバー now を使う（記録日は使わない） */
export async function markFreeTrialStartedIfFirstJournal(params: {
  email: string;
  wasFirstJournal: boolean;
  now?: Date;
}): Promise<void> {
  if (!params.wasFirstJournal) return;

  const email = normalizeEmail(params.email);
  if (!email) return;

  const at = params.now ?? new Date();
  const existing = await prisma.accountSettings.findUnique({
    where: { email },
    select: { freeTrialStartedAt: true },
  });

  if (existing) {
    if (existing.freeTrialStartedAt !== null) return;
    await prisma.accountSettings.update({
      where: { email },
      data: { freeTrialStartedAt: at },
    });
    return;
  }

  await prisma.accountSettings.create({
    data: {
      email,
      freeTrialStartedAt: at,
      profileLimit: 1,
      isAdmin: false,
      isMonitor: false,
      subscriberPdfAccess: false,
      pdfDownloadLimitPerOrder: 2,
    },
  });
}
