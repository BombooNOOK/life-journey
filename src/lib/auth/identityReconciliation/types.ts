/**
 * Pre-cutover identity reconciliation contracts (AI-8.3b1).
 *
 * Pure types only — no Prisma writes, no Firebase Admin, no Production access.
 *
 * Current verified Firebase email proves CURRENT Auth ownership only.
 * Historical legacy actor ownership requires an approved reconciliation decision.
 */

/** Classification of one UID ↔ legacy-email candidate. */
export type IdentityReconciliationClassification =
  | "exact_safe_match"
  | "firebase_only"
  | "legacy_only"
  | "ambiguous"
  | "conflicting_claim"
  | "orphaned_legacy"
  | "reuse_suspected"
  | "needs_operator_review";

/** Policy bucket for claim action. */
export type IdentityReconciliationClaimability =
  | "AUTO_APPROVABLE"
  | "REVIEW_REQUIRED"
  | "NOT_CLAIMABLE"
  | "NO_CLAIM_NEEDED";

/** Classifier recommendation (not a DB write). */
export type IdentityReconciliationClaimRecommendation =
  | "approve"
  | "review"
  | "deny"
  | "none";

export type IdentityReconciliationConfidence = "policy" | "unknown";

/**
 * Explicit pre-cutover snapshot / freeze context.
 * Required for any AUTO approval — missing freeze ⇒ review-required.
 */
export type IdentityReconciliationSnapshotEpoch = {
  snapshotEpochId: string;
  snapshotCapturedAt: string;
  /** Product email-change must remain frozen during cutover. */
  emailChangeFrozen: boolean;
  /** Out-of-band Auth email change must be operator-confirmed frozen. */
  authEmailChangeFrozen: boolean;
};

/** Optional Firebase-side evidence (unknown facts use null / absent). */
export type FirebaseReconciliationEvidence = {
  firebaseUid: string | null;
  firebaseEmailNormalized: string | null;
  firebaseCreatedAt: string | null;
  /** e.g. password | google.com — informational only */
  providerIds: string[] | null;
};

/** Optional LJD-side evidence for a normalized email actor. */
export type LjdReconciliationEvidence = {
  legacyEmailNormalized: string | null;
  accountSettingsExists: boolean | null;
  accountSettingsCreatedAt: string | null;
  profileCount: number | null;
  journalEntryCount: number | null;
  journalEarliestAt: string | null;
  journalLatestAt: string | null;
  journalSaveOperationCount: number | null;
  rolloutExists: boolean | null;
  donguriLedgerCount: number | null;
  forestResidentNumberPresent: boolean | null;
  /** True when incomplete account-delete residue is suspected. */
  incompleteDeleteSuspected: boolean | null;
};

/** Existing LegacyActorClaim evidence (read-only facts for classification). */
export type ExistingClaimEvidence = {
  claimExists: boolean | null;
  claimedIdentityId: string | null;
  claimedFirebaseUid: string | null;
  /** True when claim exists and belongs to a different Firebase UID. */
  conflictsWithCandidateUid: boolean | null;
};

/** Optional identity-shadow observation (AI-8.1c). */
export type ShadowReconciliationEvidence = {
  shadowState:
    | "disabled"
    | "empty"
    | "legacy_only"
    | "verified_only"
    | "match"
    | "email_mismatch"
    | "verified_invalid"
    | null;
};

/**
 * One reconciliation candidate. Unknown facts must be explicit (null),
 * not silently treated as false/zero unless the field is boolean|null.
 */
export type IdentityReconciliationCandidateInput = {
  snapshotEpoch: IdentityReconciliationSnapshotEpoch | null;
  firebase: FirebaseReconciliationEvidence;
  ljd: LjdReconciliationEvidence;
  existingClaim: ExistingClaimEvidence;
  shadow: ShadowReconciliationEvidence;
};

export type IdentityReconciliationClassifyResult = {
  classification: IdentityReconciliationClassification;
  claimability: IdentityReconciliationClaimability;
  claimRecommendation: IdentityReconciliationClaimRecommendation;
  reasons: string[];
  evidenceSummary: string[];
  confidence: IdentityReconciliationConfidence;
  /** Actor keys proposed only when recommendation is approve (email string). */
  proposedActorKeys: string[];
};

/**
 * Operator decision artifact (TypeScript contract only — no Prisma table in AI-8.3b1).
 */
export type IdentityReconciliationDecisionKind =
  | "approve_claim"
  | "no_claim"
  | "needs_review"
  | "deny_claim";

export type IdentityReconciliationDecision = {
  decisionId: string;
  snapshotEpochId: string;
  firebaseUid: string;
  emailNormalized: string;
  classification: IdentityReconciliationClassification;
  decision: IdentityReconciliationDecisionKind;
  /** Explicit actorKeys only — never inferred from current Auth email alone. */
  decidedActorKeys: string[];
  reasonCodes: string[];
  notes?: string;
  decidedBy?: string;
  decidedAt?: string;
};

/** Pure claim plan — never written to DB by this module. */
export type LegacyClaimPlan = {
  firebaseUid: string;
  actorKeys: string[];
};

/** Future adapters — interfaces only; not wired to real services. */
export type FirebaseIdentitySnapshotSource = {
  readonly kind: "firebase_identity_snapshot_source";
};

export type LegacyLjdSnapshotSource = {
  readonly kind: "legacy_ljd_snapshot_source";
};

export function claimabilityForClassification(
  classification: IdentityReconciliationClassification,
): IdentityReconciliationClaimability {
  switch (classification) {
    case "exact_safe_match":
      return "AUTO_APPROVABLE";
    case "firebase_only":
      return "NO_CLAIM_NEEDED";
    case "conflicting_claim":
      return "NOT_CLAIMABLE";
    case "legacy_only":
    case "ambiguous":
    case "orphaned_legacy":
    case "reuse_suspected":
    case "needs_operator_review":
      return "REVIEW_REQUIRED";
    default: {
      const _exhaustive: never = classification;
      return _exhaustive;
    }
  }
}
