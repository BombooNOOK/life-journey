import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import type { EntitlementAccountSettings } from "@/lib/entitlement/resolveUserEntitlement";

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

  return { settings, journalEntryCount };
}
