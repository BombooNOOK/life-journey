import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import type { EntitlementAccountSettings } from "@/lib/entitlement/resolveUserEntitlement";
import { isPaidSubscriber } from "@/lib/entitlement/resolveUserEntitlement";
import { resolveOfficialLaunchDate } from "@/lib/entitlement/officialLaunchDate";

const ENTITLEMENT_SETTINGS_SELECT = {
  isAdmin: true,
  isMonitor: true,
  subscriptionPlan: true,
  subscriptionStatus: true,
  freeTrialStartedAt: true,
} as const;

export type EntitlementContext = {
  settings: EntitlementAccountSettings | null;
  journalEntryCount: number;
};

function shouldBackfillFreeTrialStartedAt(
  settings: EntitlementAccountSettings | null,
  journalEntryCount: number,
): boolean {
  if (journalEntryCount <= 0) return false;
  if (settings?.freeTrialStartedAt) return false;
  if (settings?.isAdmin === true || settings?.isMonitor === true) return false;
  if (isPaidSubscriber(settings)) return false;
  return true;
}

async function backfillFreeTrialStartedAt(email: string): Promise<EntitlementAccountSettings | null> {
  const launchAt = resolveOfficialLaunchDate();
  const existing = await prisma.accountSettings.findUnique({
    where: { email },
    select: ENTITLEMENT_SETTINGS_SELECT,
  });

  if (existing) {
    const updated = await prisma.accountSettings.update({
      where: { email },
      data: { freeTrialStartedAt: launchAt },
      select: ENTITLEMENT_SETTINGS_SELECT,
    });
    return updated;
  }

  const created = await prisma.accountSettings.create({
    data: {
      email,
      freeTrialStartedAt: launchAt,
      profileLimit: 1,
      isAdmin: false,
      isMonitor: false,
      subscriberPdfAccess: false,
      pdfDownloadLimitPerOrder: 2,
    },
    select: ENTITLEMENT_SETTINGS_SELECT,
  });
  return created;
}

export async function loadEntitlementContext(viewerEmail: string): Promise<EntitlementContext> {
  const email = normalizeEmail(viewerEmail);
  if (!email) {
    return { settings: null, journalEntryCount: 0 };
  }

  const [settings, journalEntryCount] = await Promise.all([
    prisma.accountSettings.findUnique({
      where: { email },
      select: ENTITLEMENT_SETTINGS_SELECT,
    }),
    prisma.journalEntry.count({ where: { email } }),
  ]);

  if (shouldBackfillFreeTrialStartedAt(settings, journalEntryCount)) {
    const backfilled = await backfillFreeTrialStartedAt(email);
    return { settings: backfilled, journalEntryCount };
  }

  return { settings, journalEntryCount };
}
