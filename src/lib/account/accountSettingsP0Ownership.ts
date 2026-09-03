/**
 * AI-X6.7B3 — AccountSettings preferred ownership path (helper only).
 * Does NOT globally replace email-scoped reads.
 *
 * Preferred: verified UID → AccountIdentity → AccountSettings.identityId
 * Legacy fallback: only when settings.identityId already bound OR explicit claim.
 */

import type { P0OwnershipResolution } from "@/lib/account/p0IdentityOwnership";
import { prisma as defaultPrisma } from "@/lib/db";

export type AccountSettingsP0LoadResult =
  | {
      mode: "identity";
      settings: {
        id: string;
        email: string;
        identityId: string | null;
      };
    }
  | {
      mode: "legacy_email";
      settings: {
        id: string;
        email: string;
        identityId: string | null;
      } | null;
      reason: string;
    }
  | {
      mode: "mismatch";
      reason: string;
      identitySettingsId: string | null;
      emailSettingsId: string | null;
    }
  | {
      mode: "unavailable";
      reason: string;
    };

export async function loadAccountSettingsForP0Ownership(
  ownership: P0OwnershipResolution,
  deps: { db?: typeof defaultPrisma } = {},
): Promise<AccountSettingsP0LoadResult> {
  const db = deps.db ?? defaultPrisma;

  if (ownership.state === "MISMATCH") {
    return {
      mode: "mismatch",
      reason: ownership.reason,
      identitySettingsId: null,
      emailSettingsId: null,
    };
  }

  if (ownership.state === "BOUND" && ownership.identityId) {
    const byIdentity = await db.accountSettings.findFirst({
      where: { identityId: ownership.identityId },
      select: { id: true, email: true, identityId: true },
    });
    if (byIdentity) {
      return { mode: "identity", settings: byIdentity };
    }
    // Bound identity but no settings row yet — check email only as compat metadata,
    // never as ownership authority for historical bind.
    if (ownership.verifiedEmailMetadata) {
      const byEmail = await db.accountSettings.findUnique({
        where: { email: ownership.verifiedEmailMetadata },
        select: { id: true, email: true, identityId: true },
      });
      if (byEmail?.identityId && byEmail.identityId !== ownership.identityId) {
        return {
          mode: "mismatch",
          reason: "email_settings_bound_elsewhere",
          identitySettingsId: null,
          emailSettingsId: byEmail.id,
        };
      }
      return {
        mode: "legacy_email",
        settings: byEmail,
        reason: "bound_identity_settings_missing",
      };
    }
    return { mode: "unavailable", reason: "bound_identity_no_settings" };
  }

  // UNBOUND / AMBIGUOUS — legacy email read only if already explicitly bound/claimed
  // is NOT performed here (would use email alone). Fail closed to unavailable.
  return {
    mode: "unavailable",
    reason: `ownership_${ownership.state.toLowerCase()}`,
  };
}
