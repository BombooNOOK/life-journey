/**
 * AI-X6.7B2 — Deterministic P0 identity ownership backfill resolution (pure).
 *
 * CURRENT AUTH EMAIL ALONE MUST NEVER GRANT HISTORICAL OWNERSHIP.
 *
 * Allowed evidence only (precedence order):
 *  1. AccountSettings already bound: settings.email === row.email AND settings.identityId set
 *  2. Explicit LegacyActorClaim: claim.actorKey === row.email → claim.identityId
 *  3. Historical AccountIdentityEmail primary: exactly one identity with primary emailNormalized === row.email
 *
 * Rules:
 *  - settings + claim agree → BOUND (that identity)
 *  - settings + claim conflict → AMBIGUOUS (never guess)
 *  - settings only OR claim only → BOUND (that identity); primary fan-out does not override
 *  - neither settings nor claim → use primary only if exactly one identity; else UNBOUND/AMBIGUOUS
 *
 * Conflicts / zero evidence → AMBIGUOUS / UNBOUND (never guess).
 */

export type P0BackfillEvidence = {
  /** email → identityId for AccountSettings rows with non-null identityId */
  settingsByEmail: ReadonlyMap<string, string>;
  /** email/actorKey → identityId for explicit legacy claims */
  claimByActorKey: ReadonlyMap<string, string>;
  /**
   * emailNormalized → identityIds that currently hold status=primary for that email.
   * Must list ALL matching identity ids (0, 1, or many).
   */
  primaryEmailIdentityIds: ReadonlyMap<string, readonly string[]>;
};

export type P0BackfillClass = "BOUND" | "UNBOUND" | "AMBIGUOUS";

export type P0BackfillResolution = {
  class: P0BackfillClass;
  identityId: string | null;
  evidence:
    | "settings_identityId"
    | "legacy_actor_claim"
    | "primary_identity_email"
    | "none"
    | "conflict";
  reason: string;
};

function normalizeEmailKey(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Resolve durable identityId for one legacy Profile / JournalEntry email owner key.
 * Does not write. Does not use "current Firebase session email".
 */
export function resolveP0IdentityOwnershipForLegacyEmail(
  rowEmail: string,
  evidence: P0BackfillEvidence,
): P0BackfillResolution {
  const email = normalizeEmailKey(rowEmail);
  if (!email) {
    return {
      class: "UNBOUND",
      identityId: null,
      evidence: "none",
      reason: "empty_email",
    };
  }

  const fromSettings = evidence.settingsByEmail.get(email) ?? null;
  const fromClaim = evidence.claimByActorKey.get(email) ?? null;
  const fromPrimary = [...(evidence.primaryEmailIdentityIds.get(email) ?? [])];

  if (fromSettings && fromClaim && fromSettings !== fromClaim) {
    return {
      class: "AMBIGUOUS",
      identityId: null,
      evidence: "conflict",
      reason: "settings_claim_conflict",
    };
  }

  if (fromSettings) {
    return {
      class: "BOUND",
      identityId: fromSettings,
      evidence: "settings_identityId",
      reason: fromClaim ? "settings_and_claim_agree" : "settings_bound",
    };
  }

  if (fromClaim) {
    return {
      class: "BOUND",
      identityId: fromClaim,
      evidence: "legacy_actor_claim",
      reason: "explicit_claim",
    };
  }

  // No settings/claim — primary email is last resort and must be unique.
  if (fromPrimary.length === 0) {
    return {
      class: "UNBOUND",
      identityId: null,
      evidence: "none",
      reason: "no_explicit_ownership_evidence",
    };
  }
  if (fromPrimary.length > 1) {
    return {
      class: "AMBIGUOUS",
      identityId: null,
      evidence: "conflict",
      reason: "multiple_primary_identity_emails",
    };
  }

  return {
    class: "BOUND",
    identityId: fromPrimary[0]!,
    evidence: "primary_identity_email",
    reason: "single_primary_identity_email",
  };
}

export type P0BackfillCountStrategy = {
  bound: number;
  unbound: number;
  ambiguous: number;
};

export function countP0BackfillResolutions(
  resolutions: ReadonlyArray<P0BackfillResolution>,
): P0BackfillCountStrategy {
  let bound = 0;
  let unbound = 0;
  let ambiguous = 0;
  for (const r of resolutions) {
    if (r.class === "BOUND") bound += 1;
    else if (r.class === "UNBOUND") unbound += 1;
    else ambiguous += 1;
  }
  return { bound, unbound, ambiguous };
}
