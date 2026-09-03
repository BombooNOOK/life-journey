/**
 * AI-X6.7B7B — Deterministic value/commerce identity backfill resolution.
 *
 * Reuses B2 email evidence precedence, plus identity-owned Profile when
 * profileId is present and authoritative.
 *
 * CURRENT AUTH EMAIL ALONE MUST NEVER GRANT OWNERSHIP.
 */

import {
  resolveP0IdentityOwnershipForLegacyEmail,
  type P0BackfillEvidence,
  type P0BackfillResolution,
} from "@/lib/account/p0IdentityOwnershipBackfill";

export type ValueBackfillEvidence = P0BackfillEvidence & {
  /** profileId → identityId for Profiles with non-null identityId */
  profileIdentityById: ReadonlyMap<string, string>;
};

export type ValueBackfillClass =
  | "BOUND"
  | "UNBOUND"
  | "AMBIGUOUS";

export type ValueBackfillResolution = P0BackfillResolution & {
  evidence:
    | P0BackfillResolution["evidence"]
    | "identity_owned_profile";
};

/**
 * Resolve durable identityId for one Donguri ledger / Order email owner key.
 * Does not write. Does not use current Firebase session email.
 */
export function resolveValueIdentityOwnershipForLegacyRow(
  row: { email: string; profileId?: string | null },
  evidence: ValueBackfillEvidence,
): ValueBackfillResolution {
  const base = resolveP0IdentityOwnershipForLegacyEmail(row.email, evidence);
  const profileId = row.profileId?.trim() || "";
  const fromProfile =
    profileId ? evidence.profileIdentityById.get(profileId) ?? null : null;

  if (!fromProfile) {
    return base;
  }

  if (base.class === "BOUND" && base.identityId) {
    if (base.identityId === fromProfile) {
      return {
        ...base,
        evidence:
          base.evidence === "settings_identityId" ||
          base.evidence === "legacy_actor_claim"
            ? base.evidence
            : "identity_owned_profile",
        reason:
          base.evidence === "primary_identity_email"
            ? "identity_owned_profile_agrees"
            : base.reason,
      };
    }
    return {
      class: "AMBIGUOUS",
      identityId: null,
      evidence: "conflict",
      reason: "email_evidence_profile_conflict",
    };
  }

  if (base.class === "AMBIGUOUS") {
    return base;
  }

  // UNBOUND email evidence + identity-owned profile → BOUND via profile
  return {
    class: "BOUND",
    identityId: fromProfile,
    evidence: "identity_owned_profile",
    reason: "identity_owned_profile",
  };
}
