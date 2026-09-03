import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import type { EntitlementAccountSettings } from "@/lib/entitlement/resolveUserEntitlement";
import { loadEntitlementContextUnderAuthority } from "@/lib/value/entitlementIdentityAuthority";

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

/**
 * Entitlement context for viewer.
 * Gate OFF (default): email-scoped legacy.
 * Gate ON (LJD_P1_VALUE_IDENTITY_READ_AUTHORITY_ENABLED): identity-owned settings + journal counts.
 */
export async function loadEntitlementContext(viewerEmail: string): Promise<EntitlementContext> {
  return loadEntitlementContextUnderAuthority(viewerEmail);
}

/** Legacy email-only loader retained for explicit callers / tests. */
export async function loadEntitlementContextByEmailLegacy(
  viewerEmail: string,
): Promise<EntitlementContext> {
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
