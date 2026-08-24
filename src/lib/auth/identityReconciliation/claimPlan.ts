/**
 * Pure LegacyActorClaim plan builder (AI-8.3b1).
 *
 * Converts an APPROVED operator decision into an explicit claim plan.
 * Never writes to the database. Never infers actorKeys from current Auth email.
 */

import type {
  IdentityReconciliationDecision,
  LegacyClaimPlan,
} from "@/lib/auth/identityReconciliation/types";

function dedupeActorKeys(actorKeys: ReadonlyArray<string>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of actorKeys) {
    const key = typeof raw === "string" ? raw.trim().toLowerCase() : "";
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

/**
 * Build a claim plan from an operator decision.
 * Only `approve_claim` with explicit decidedActorKeys yields a non-empty plan.
 */
export function buildLegacyClaimPlan(
  decision: IdentityReconciliationDecision,
): LegacyClaimPlan {
  if (decision.decision !== "approve_claim") {
    return { firebaseUid: decision.firebaseUid, actorKeys: [] };
  }
  return {
    firebaseUid: decision.firebaseUid,
    actorKeys: dedupeActorKeys(decision.decidedActorKeys),
  };
}
