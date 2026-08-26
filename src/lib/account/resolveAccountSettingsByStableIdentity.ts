/**
 * AccountSettings stable identity resolution foundation (AI-X6.5A).
 *
 * LOOKUP ONLY. Does not create Identity / Email / Claims / Settings.
 * Does not bind from current Firebase email automatically.
 *
 * Authority:
 *   identityId-bound AccountSettings → durable ownership
 *   identityId NULL → legacy_unbound (transitional; not auto-bound here)
 *
 * Current auth email is metadata. Matching email alone must NEVER grant
 * another identity's settings.
 *
 * Future account-delete order (design only — not implemented here):
 *   1. product/account rows purged (incl. AccountSettings)
 *   2. other identity-scoped product/native state
 *   3. LegacyActorClaims removed
 *   4. AccountIdentity / primary email removed
 *   5. email reuse allowed only after reconciliation
 * FK Restrict enforces settings purge before identity delete.
 *
 * Server-side only.
 */

import {
  resolveVerifiedViewerActorIdentity,
  type ResolveVerifiedViewerActorIdentityDeps,
  type ResolveVerifiedViewerActorIdentityResult,
} from "@/lib/auth/resolveVerifiedViewerActorIdentity";
import { prisma as defaultPrisma } from "@/lib/db";

export type AccountSettingsIdentityResolveState =
  | "verified_session_required"
  | "identity_not_bound"
  | "identity_incomplete"
  | "resolved"
  | "legacy_unbound"
  | "not_found"
  | "conflict";

export type AccountSettingsIdentityResolveResult =
  | { state: "verified_session_required" }
  | {
      state: "identity_not_bound";
      firebaseUid: string;
    }
  | {
      state: "identity_incomplete";
      firebaseUid: string;
      identityId?: string;
      reason: string;
    }
  | {
      state: "resolved";
      identityId: string;
      firebaseUid: string;
      accountSettingsId: string;
      /** Mutable contact metadata on the settings row — not ownership proof. */
      emailMetadata: string;
    }
  | {
      state: "legacy_unbound";
      identityId: string;
      firebaseUid: string;
      /** Present when a legacy email-keyed row exists but identityId is still NULL. */
      legacyAccountSettingsId?: string;
      legacyEmailMetadata?: string;
    }
  | {
      state: "not_found";
      identityId: string;
      firebaseUid: string;
    }
  | {
      state: "conflict";
      identityId: string;
      firebaseUid: string;
      reason:
        | "settings_bound_to_other_identity"
        | "multiple_settings_for_identity"
        | "identity_unavailable";
    };

export type AccountSettingsIdentityDb = {
  accountSettings: {
    findUnique: typeof defaultPrisma.accountSettings.findUnique;
    findMany: typeof defaultPrisma.accountSettings.findMany;
  };
};

export type ResolveAccountSettingsByStableIdentityDeps = {
  resolveIdentity?: () => Promise<ResolveVerifiedViewerActorIdentityResult>;
  identityDeps?: ResolveVerifiedViewerActorIdentityDeps;
  settingsDb?: AccountSettingsIdentityDb;
};

/**
 * Resolve AccountSettings via verified AccountIdentity only.
 * Never grants ownership from current email equality alone.
 */
export async function resolveAccountSettingsByStableIdentity(
  deps: ResolveAccountSettingsByStableIdentityDeps = {},
): Promise<AccountSettingsIdentityResolveResult> {
  const settingsDb = deps.settingsDb ?? defaultPrisma;

  let identity: ResolveVerifiedViewerActorIdentityResult;
  try {
    identity = deps.resolveIdentity
      ? await deps.resolveIdentity()
      : await resolveVerifiedViewerActorIdentity(deps.identityDeps ?? {});
  } catch {
    return {
      state: "conflict",
      identityId: "",
      firebaseUid: "",
      reason: "identity_unavailable",
    };
  }

  if (identity.state === "verified_session_required") {
    return { state: "verified_session_required" };
  }
  if (identity.state === "identity_not_bound") {
    return {
      state: "identity_not_bound",
      firebaseUid: identity.firebaseUid,
    };
  }
  if (identity.state === "identity_incomplete") {
    return {
      state: "identity_incomplete",
      firebaseUid: identity.firebaseUid,
      identityId: identity.identityId,
      reason: identity.reason,
    };
  }

  const { identityId, firebaseUid } = identity;

  const byIdentity = await settingsDb.accountSettings.findMany({
    where: { identityId },
    select: { id: true, email: true, identityId: true },
    take: 2,
  });

  if (byIdentity.length >= 2) {
    return {
      state: "conflict",
      identityId,
      firebaseUid,
      reason: "multiple_settings_for_identity",
    };
  }

  if (byIdentity.length === 1) {
    const row = byIdentity[0]!;
    return {
      state: "resolved",
      identityId,
      firebaseUid,
      accountSettingsId: row.id,
      emailMetadata: row.email,
    };
  }

  // No identityId-bound row. Do NOT auto-bind from current email.
  // Observe a legacy email-keyed row for transitional diagnostics only.
  const verifiedEmail = identity.verifiedEmailMetadata;
  if (verifiedEmail) {
    const legacy = await settingsDb.accountSettings.findUnique({
      where: { email: verifiedEmail },
      select: { id: true, email: true, identityId: true },
    });
    if (legacy) {
      if (legacy.identityId && legacy.identityId !== identityId) {
        return {
          state: "conflict",
          identityId,
          firebaseUid,
          reason: "settings_bound_to_other_identity",
        };
      }
      if (!legacy.identityId) {
        return {
          state: "legacy_unbound",
          identityId,
          firebaseUid,
          legacyAccountSettingsId: legacy.id,
          legacyEmailMetadata: legacy.email,
        };
      }
    }
  }

  return {
    state: "not_found",
    identityId,
    firebaseUid,
  };
}
