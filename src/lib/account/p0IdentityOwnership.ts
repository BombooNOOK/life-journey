/**
 * AI-X6.7B3 — Canonical P0 identity ownership resolution contract.
 *
 * Reuses resolveVerifiedViewerActorIdentity (UID → AccountIdentity → claims).
 * CURRENT AUTH EMAIL ALONE MUST NEVER GRANT HISTORICAL OWNERSHIP.
 *
 * States: BOUND | UNBOUND | AMBIGUOUS | MISMATCH
 * Never emits CURRENT_AUTH_EMAIL_ONLY as ownership authority.
 */

import {
  resolveVerifiedViewerActorIdentity,
  type ResolveVerifiedViewerActorIdentityDeps,
  type ResolveVerifiedViewerActorIdentityResult,
} from "@/lib/auth/resolveVerifiedViewerActorIdentity";
import { prisma as defaultPrisma } from "@/lib/db";

export type P0OwnershipState =
  | "BOUND"
  | "UNBOUND"
  | "AMBIGUOUS"
  | "MISMATCH";

export type P0OwnershipEvidenceSource =
  | "VERIFIED_FIREBASE_UID"
  | "BOUND_ACCOUNT_SETTINGS"
  | "EXPLICIT_LEGACY_CLAIM"
  | "HISTORICAL_PRIMARY_IDENTITY_EMAIL"
  | "NONE"
  | "CONFLICT";

/** Forbidden — never returned as ownership authority. */
export type P0ForbiddenEvidence = "CURRENT_AUTH_EMAIL_ONLY";

export type P0OwnershipResolution = {
  state: P0OwnershipState;
  identityId: string | null;
  firebaseUid: string | null;
  evidenceSource: P0OwnershipEvidenceSource;
  /** Explicit legacy claim actorKeys when identity is bound. */
  legacyActorKeys: string[];
  /** Verified email metadata only — not ownership authority. */
  verifiedEmailMetadata: string;
  reason: string;
};

export type P0OwnershipResolverDeps = ResolveVerifiedViewerActorIdentityDeps & {
  db?: {
    accountSettings: {
      findUnique: typeof defaultPrisma.accountSettings.findUnique;
      findFirst: typeof defaultPrisma.accountSettings.findFirst;
    };
  };
};

function unbound(
  partial: Partial<P0OwnershipResolution> & { reason: string },
): P0OwnershipResolution {
  return {
    state: "UNBOUND",
    identityId: null,
    firebaseUid: partial.firebaseUid ?? null,
    evidenceSource: "NONE",
    legacyActorKeys: [],
    verifiedEmailMetadata: partial.verifiedEmailMetadata ?? "",
    reason: partial.reason,
  };
}

/**
 * Resolve durable P0 ownership for the current verified session.
 * Preferred path: verified UID → AccountIdentity → optional settings check.
 */
export async function resolveP0IdentityOwnership(
  deps: P0OwnershipResolverDeps = {},
): Promise<P0OwnershipResolution> {
  const resolved = await resolveVerifiedViewerActorIdentity(deps);
  return classifyVerifiedActorIdentity(resolved, deps);
}

export async function classifyVerifiedActorIdentity(
  resolved: ResolveVerifiedViewerActorIdentityResult,
  deps: P0OwnershipResolverDeps = {},
): Promise<P0OwnershipResolution> {
  if (resolved.state === "verified_session_required") {
    return unbound({ reason: "verified_session_required" });
  }

  if (resolved.state === "identity_not_bound") {
    return unbound({
      firebaseUid: resolved.firebaseUid,
      verifiedEmailMetadata: resolved.verifiedEmailMetadata,
      reason: "identity_not_bound",
    });
  }

  if (resolved.state === "identity_incomplete") {
    if (resolved.reason === "implicit_email_authority_detected") {
      return {
        state: "AMBIGUOUS",
        identityId: resolved.identityId ?? null,
        firebaseUid: resolved.firebaseUid,
        evidenceSource: "CONFLICT",
        legacyActorKeys: [],
        verifiedEmailMetadata: resolved.verifiedEmailMetadata,
        reason: "implicit_email_authority_detected",
      };
    }
    return {
      state: "UNBOUND",
      identityId: resolved.identityId ?? null,
      firebaseUid: resolved.firebaseUid,
      evidenceSource: "NONE",
      legacyActorKeys: [],
      verifiedEmailMetadata: resolved.verifiedEmailMetadata,
      reason: resolved.reason,
    };
  }

  // state === "resolved" — UID-bound identity is authoritative.
  const db = deps.db ?? defaultPrisma;
  const settingsByIdentity = await db.accountSettings.findFirst({
    where: { identityId: resolved.identityId },
    select: { id: true, email: true, identityId: true },
  });

  // Optional mismatch: email-scoped settings row points elsewhere.
  if (resolved.verifiedEmailMetadata) {
    const settingsByEmail = await db.accountSettings.findUnique({
      where: { email: resolved.verifiedEmailMetadata },
      select: { id: true, email: true, identityId: true },
    });
    if (
      settingsByEmail?.identityId &&
      settingsByEmail.identityId !== resolved.identityId
    ) {
      return {
        state: "MISMATCH",
        identityId: resolved.identityId,
        firebaseUid: resolved.firebaseUid,
        evidenceSource: "CONFLICT",
        legacyActorKeys: resolved.legacyActorKeys,
        verifiedEmailMetadata: resolved.verifiedEmailMetadata,
        reason: "settings_email_identity_mismatch",
      };
    }
  }

  return {
    state: "BOUND",
    identityId: resolved.identityId,
    firebaseUid: resolved.firebaseUid,
    evidenceSource: settingsByIdentity
      ? "BOUND_ACCOUNT_SETTINGS"
      : resolved.legacyActorKeys.length > 0
        ? "EXPLICIT_LEGACY_CLAIM"
        : "VERIFIED_FIREBASE_UID",
    legacyActorKeys: resolved.legacyActorKeys,
    verifiedEmailMetadata: resolved.verifiedEmailMetadata,
    reason: "verified_uid_identity_bound",
  };
}

/**
 * Dual-write identityId candidate. Returns null when gate off or not exactly BOUND.
 * Never invents ownership from current email alone.
 */
export function dualWriteIdentityIdOrNull(input: {
  dualWriteEnabled: boolean;
  ownership: P0OwnershipResolution;
}): string | null {
  if (!input.dualWriteEnabled) return null;
  if (input.ownership.state !== "BOUND") return null;
  if (!input.ownership.identityId) return null;
  return input.ownership.identityId;
}

export type ProfileIdentityCheck =
  | { ok: true; mode: "match" | "legacy_null" }
  | { ok: false; mode: "mismatch" | "unavailable"; reason: string };

/**
 * Fail-closed profile context check before writing JournalEntry.identityId.
 */
export function checkProfileIdentityForDualWrite(input: {
  resolvedIdentityId: string;
  profileIdentityId: string | null | undefined;
}): ProfileIdentityCheck {
  if (
    input.profileIdentityId == null ||
    input.profileIdentityId === ""
  ) {
    return { ok: true, mode: "legacy_null" };
  }
  if (input.profileIdentityId === input.resolvedIdentityId) {
    return { ok: true, mode: "match" };
  }
  return {
    ok: false,
    mode: "mismatch",
    reason: "profile_identity_mismatch",
  };
}
