/**
 * Pure identity reconciliation classifier (AI-8.3b1).
 *
 * Policy-based — not probabilistic. Never writes LegacyActorClaim.
 * Current Firebase email alone never auto-approves a historical claim.
 */

import {
  claimabilityForClassification,
  type IdentityReconciliationCandidateInput,
  type IdentityReconciliationClassifyResult,
  type IdentityReconciliationClassification,
} from "@/lib/auth/identityReconciliation/types";

function hasFirebaseUser(input: IdentityReconciliationCandidateInput): boolean {
  return Boolean(input.firebase.firebaseUid && input.firebase.firebaseEmailNormalized);
}

function hasLjdHistory(input: IdentityReconciliationCandidateInput): boolean {
  const l = input.ljd;
  if (l.accountSettingsExists === true) return true;
  if ((l.profileCount ?? 0) > 0) return true;
  if ((l.journalEntryCount ?? 0) > 0) return true;
  if ((l.journalSaveOperationCount ?? 0) > 0) return true;
  if (l.rolloutExists === true) return true;
  if ((l.donguriLedgerCount ?? 0) > 0) return true;
  return false;
}

function emailsAligned(input: IdentityReconciliationCandidateInput): boolean {
  const a = input.firebase.firebaseEmailNormalized;
  const b = input.ljd.legacyEmailNormalized;
  return Boolean(a && b && a === b);
}

function snapshotAllowsAutoApprove(
  input: IdentityReconciliationCandidateInput,
  reasons: string[],
): boolean {
  const epoch = input.snapshotEpoch;
  if (!epoch) {
    reasons.push("snapshot_epoch_missing");
    return false;
  }
  if (!epoch.snapshotEpochId.trim()) {
    reasons.push("snapshot_epoch_id_empty");
    return false;
  }
  if (!epoch.snapshotCapturedAt.trim()) {
    reasons.push("snapshot_captured_at_empty");
    return false;
  }
  if (epoch.emailChangeFrozen !== true) {
    reasons.push("email_change_not_frozen");
    return false;
  }
  if (epoch.authEmailChangeFrozen !== true) {
    reasons.push("auth_email_change_not_frozen");
    return false;
  }
  return true;
}

function buildEvidenceSummary(input: IdentityReconciliationCandidateInput): string[] {
  const summary: string[] = [];
  if (input.firebase.firebaseUid) summary.push("firebase_uid_present");
  if (input.firebase.firebaseEmailNormalized) summary.push("firebase_email_present");
  if (hasLjdHistory(input)) summary.push("ljd_history_present");
  else summary.push("ljd_history_absent");
  if (input.existingClaim.claimExists === true) summary.push("existing_claim_present");
  if (input.existingClaim.conflictsWithCandidateUid === true) {
    summary.push("existing_claim_conflicts");
  }
  if (input.shadow.shadowState) summary.push(`shadow:${input.shadow.shadowState}`);
  if (input.snapshotEpoch) summary.push(`epoch:${input.snapshotEpoch.snapshotEpochId}`);
  return summary;
}

function resultFor(
  classification: IdentityReconciliationClassification,
  claimRecommendation: IdentityReconciliationClassifyResult["claimRecommendation"],
  reasons: string[],
  evidenceSummary: string[],
  proposedActorKeys: string[] = [],
): IdentityReconciliationClassifyResult {
  return {
    classification,
    claimability: claimabilityForClassification(classification),
    claimRecommendation,
    reasons,
    evidenceSummary,
    confidence: "policy",
    proposedActorKeys,
  };
}

/**
 * Classify one reconciliation candidate.
 * AUTO approve only for exact_safe_match under an explicit frozen snapshot epoch.
 */
export function classifyIdentityReconciliationCandidate(
  input: IdentityReconciliationCandidateInput,
): IdentityReconciliationClassifyResult {
  const reasons: string[] = [];
  const evidenceSummary = buildEvidenceSummary(input);

  // D — conflicting claim always deny (before other paths).
  if (
    input.existingClaim.claimExists === true &&
    input.existingClaim.conflictsWithCandidateUid === true
  ) {
    reasons.push("claim_owned_by_other_identity");
    return resultFor("conflicting_claim", "deny", reasons, evidenceSummary);
  }

  // If claim exists for this same UID already, historical ownership is already settled.
  if (
    input.existingClaim.claimExists === true &&
    input.existingClaim.conflictsWithCandidateUid === false &&
    hasFirebaseUser(input)
  ) {
    reasons.push("claim_already_owned_by_candidate");
    return resultFor("exact_safe_match", "none", reasons, evidenceSummary);
  }

  const firebaseOk = hasFirebaseUser(input);
  const ljdOk = hasLjdHistory(input);
  const shadow = input.shadow.shadowState;

  // F — mismatch / invalid shadow never auto-approve.
  if (shadow === "email_mismatch" || shadow === "verified_invalid") {
    reasons.push(`shadow_${shadow}`);
    if (firebaseOk && ljdOk) {
      return resultFor("needs_operator_review", "review", reasons, evidenceSummary);
    }
    if (!firebaseOk && ljdOk) {
      return resultFor("legacy_only", "review", reasons, evidenceSummary);
    }
    if (firebaseOk && !ljdOk) {
      return resultFor("needs_operator_review", "review", reasons, evidenceSummary);
    }
    return resultFor("needs_operator_review", "review", reasons, evidenceSummary);
  }

  // E — reuse / incomplete delete.
  if (input.ljd.incompleteDeleteSuspected === true) {
    reasons.push("incomplete_delete_suspected");
    if (!firebaseOk && ljdOk) {
      return resultFor("orphaned_legacy", "review", reasons, evidenceSummary);
    }
    return resultFor("reuse_suspected", "review", reasons, evidenceSummary);
  }

  // C — legacy only.
  if (!firebaseOk && ljdOk) {
    reasons.push("ljd_rows_without_firebase_uid");
    return resultFor("legacy_only", "review", reasons, evidenceSummary);
  }

  // B — firebase only.
  if (firebaseOk && !ljdOk) {
    reasons.push("firebase_user_without_ljd_history");
    return resultFor("firebase_only", "none", reasons, evidenceSummary);
  }

  // Neither side.
  if (!firebaseOk && !ljdOk) {
    reasons.push("insufficient_evidence");
    return resultFor("needs_operator_review", "review", reasons, evidenceSummary);
  }

  // Both sides present.
  if (!emailsAligned(input)) {
    reasons.push("firebase_email_and_legacy_email_differ");
    return resultFor("ambiguous", "review", reasons, evidenceSummary);
  }

  // A — potential exact_safe_match only with snapshot freeze.
  if (!snapshotAllowsAutoApprove(input, reasons)) {
    reasons.push("cutover_freeze_incomplete");
    return resultFor("needs_operator_review", "review", reasons, evidenceSummary);
  }

  if (shadow === "legacy_only" || shadow === "verified_only") {
    reasons.push(`shadow_${shadow}_blocks_auto_approve`);
    return resultFor("ambiguous", "review", reasons, evidenceSummary);
  }

  // Unknown claim state is not safe for auto-approve.
  if (input.existingClaim.claimExists === null) {
    reasons.push("existing_claim_state_unknown");
    return resultFor("needs_operator_review", "review", reasons, evidenceSummary);
  }

  reasons.push("exact_email_uid_ljd_alignment_under_frozen_snapshot");
  const actorKey = input.ljd.legacyEmailNormalized!;
  return resultFor("exact_safe_match", "approve", reasons, evidenceSummary, [actorKey]);
}
