/**
 * Identity reconciliation foundation (AI-8.3b1).
 *
 * Pure contracts + classification + dry-run report + claim-plan builder.
 * Does NOT write AccountIdentity / LegacyActorClaim.
 * Does NOT enumerate real Firebase users or read Production DB.
 */

export * from "@/lib/auth/identityReconciliation/types";
export { classifyIdentityReconciliationCandidate } from "@/lib/auth/identityReconciliation/classify";
export { buildLegacyClaimPlan } from "@/lib/auth/identityReconciliation/claimPlan";
export {
  buildIdentityReconciliationReport,
  buildIdentityReconciliationReportRow,
  identityReconciliationReportToCsv,
} from "@/lib/auth/identityReconciliation/report";
