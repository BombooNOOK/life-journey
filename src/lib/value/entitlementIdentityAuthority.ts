/**
 * AI-X6.7B7B — Entitlement authority under identity ownership.
 *
 * Canonical path: verified UID → AccountIdentity → identity-owned AccountSettings
 * + identity-owned JournalEntry counts.
 *
 * Email may help contact/sync metadata but cannot independently grant entitlement
 * when identity mode is ON.
 */

import type { P0OwnershipResolution } from "@/lib/account/p0IdentityOwnership";
import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import type { EntitlementContext } from "@/lib/entitlement/accountSettingsForEntitlement";
import { resolveValueIdentityOwnership } from "@/lib/value/valueIdentityOwnership";
import { isP1ValueIdentityReadAuthorityEnabled } from "@/lib/value/valueIdentityGates";

const ENTITLEMENT_SETTINGS_SELECT = {
  isAdmin: true,
  isMonitor: true,
  subscriptionPlan: true,
  subscriptionStatus: true,
  freeTrialStartedAt: true,
} as const;

/**
 * Identity-mode entitlement load. Fail-closed → empty entitlement when unbound.
 */
export async function loadEntitlementContextForIdentity(
  ownership: P0OwnershipResolution,
): Promise<EntitlementContext> {
  if (ownership.state !== "BOUND" || !ownership.identityId) {
    return { settings: null, journalEntryCount: 0 };
  }

  const [settings, journalEntryCount] = await Promise.all([
    prisma.accountSettings.findFirst({
      where: { identityId: ownership.identityId },
      select: ENTITLEMENT_SETTINGS_SELECT,
    }),
    prisma.journalEntry.count({
      where: { identityId: ownership.identityId },
    }),
  ]);

  return { settings, journalEntryCount };
}

/**
 * Bridge: gate OFF → email-scoped legacy; gate ON → identity-owned.
 */
export async function loadEntitlementContextUnderAuthority(
  viewerEmail: string,
): Promise<EntitlementContext> {
  if (!isP1ValueIdentityReadAuthorityEnabled()) {
    const email = normalizeEmail(viewerEmail);
    if (!email) return { settings: null, journalEntryCount: 0 };
    const [settings, journalEntryCount] = await Promise.all([
      prisma.accountSettings.findUnique({
        where: { email },
        select: ENTITLEMENT_SETTINGS_SELECT,
      }),
      prisma.journalEntry.count({ where: { email } }),
    ]);
    return { settings, journalEntryCount };
  }

  const ownership = await resolveValueIdentityOwnership();
  return loadEntitlementContextForIdentity(ownership);
}
