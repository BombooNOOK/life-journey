import { describe, expect, it } from "vitest";

import { buildLegacyClaimPlan } from "@/lib/auth/identityReconciliation/claimPlan";
import { classifyIdentityReconciliationCandidate } from "@/lib/auth/identityReconciliation/classify";
import {
  buildIdentityReconciliationReport,
  identityReconciliationReportToCsv,
} from "@/lib/auth/identityReconciliation/report";
import type {
  IdentityReconciliationCandidateInput,
  IdentityReconciliationDecision,
  IdentityReconciliationSnapshotEpoch,
} from "@/lib/auth/identityReconciliation/types";

const FROZEN_EPOCH: IdentityReconciliationSnapshotEpoch = {
  snapshotEpochId: "epoch-local-test-1",
  snapshotCapturedAt: "2026-08-24T00:00:00.000Z",
  emailChangeFrozen: true,
  authEmailChangeFrozen: true,
};

function baseInput(
  overrides: Partial<{
    snapshotEpoch: IdentityReconciliationSnapshotEpoch | null;
    firebase: Partial<IdentityReconciliationCandidateInput["firebase"]>;
    ljd: Partial<IdentityReconciliationCandidateInput["ljd"]>;
    existingClaim: Partial<IdentityReconciliationCandidateInput["existingClaim"]>;
    shadow: Partial<IdentityReconciliationCandidateInput["shadow"]>;
  }> = {},
): IdentityReconciliationCandidateInput {
  return {
    snapshotEpoch: overrides.snapshotEpoch === undefined ? FROZEN_EPOCH : overrides.snapshotEpoch,
    firebase: {
      firebaseUid: "uid-a",
      firebaseEmailNormalized: "a@example.com",
      firebaseCreatedAt: "2024-01-01T00:00:00.000Z",
      providerIds: ["password"],
      ...overrides.firebase,
    },
    ljd: {
      legacyEmailNormalized: "a@example.com",
      accountSettingsExists: true,
      accountSettingsCreatedAt: "2024-01-02T00:00:00.000Z",
      profileCount: 1,
      journalEntryCount: 2,
      journalEarliestAt: "2024-02-01T00:00:00.000Z",
      journalLatestAt: "2024-06-01T00:00:00.000Z",
      journalSaveOperationCount: 1,
      rolloutExists: true,
      donguriLedgerCount: 3,
      forestResidentNumberPresent: true,
      incompleteDeleteSuspected: false,
      ...overrides.ljd,
    },
    existingClaim: {
      claimExists: false,
      claimedIdentityId: null,
      claimedFirebaseUid: null,
      conflictsWithCandidateUid: false,
      ...overrides.existingClaim,
    },
    shadow: {
      shadowState: "match",
      ...overrides.shadow,
    },
  };
}

describe("classifyIdentityReconciliationCandidate", () => {
  it("1. exact safe match under frozen snapshot", () => {
    const result = classifyIdentityReconciliationCandidate(baseInput());
    expect(result.classification).toBe("exact_safe_match");
    expect(result.claimability).toBe("AUTO_APPROVABLE");
    expect(result.claimRecommendation).toBe("approve");
    expect(result.proposedActorKeys).toEqual(["a@example.com"]);
    expect(result.confidence).toBe("policy");
  });

  it("2. firebase only → no claim", () => {
    const result = classifyIdentityReconciliationCandidate(
      baseInput({
        ljd: {
          legacyEmailNormalized: "a@example.com",
          accountSettingsExists: false,
          profileCount: 0,
          journalEntryCount: 0,
          journalSaveOperationCount: 0,
          rolloutExists: false,
          donguriLedgerCount: 0,
          forestResidentNumberPresent: false,
          incompleteDeleteSuspected: false,
          accountSettingsCreatedAt: null,
          journalEarliestAt: null,
          journalLatestAt: null,
        },
      }),
    );
    expect(result.classification).toBe("firebase_only");
    expect(result.claimRecommendation).toBe("none");
    expect(result.proposedActorKeys).toEqual([]);
  });

  it("3. legacy only → never approve", () => {
    const result = classifyIdentityReconciliationCandidate(
      baseInput({
        firebase: {
          firebaseUid: null,
          firebaseEmailNormalized: null,
          firebaseCreatedAt: null,
          providerIds: null,
        },
      }),
    );
    expect(result.classification).toBe("legacy_only");
    expect(result.claimRecommendation).not.toBe("approve");
    expect(result.proposedActorKeys).toEqual([]);
  });

  it("4. conflicting claim → deny", () => {
    const result = classifyIdentityReconciliationCandidate(
      baseInput({
        existingClaim: {
          claimExists: true,
          claimedIdentityId: "identity-other",
          claimedFirebaseUid: "uid-other",
          conflictsWithCandidateUid: true,
        },
      }),
    );
    expect(result.classification).toBe("conflicting_claim");
    expect(result.claimability).toBe("NOT_CLAIMABLE");
    expect(result.claimRecommendation).toBe("deny");
    expect(result.proposedActorKeys).toEqual([]);
  });

  it("5. orphaned legacy (incomplete delete, no firebase)", () => {
    const result = classifyIdentityReconciliationCandidate(
      baseInput({
        firebase: {
          firebaseUid: null,
          firebaseEmailNormalized: null,
          firebaseCreatedAt: null,
          providerIds: null,
        },
        ljd: { incompleteDeleteSuspected: true },
      }),
    );
    expect(result.classification).toBe("orphaned_legacy");
    expect(result.claimRecommendation).toBe("review");
  });

  it("6. reuse suspected", () => {
    const result = classifyIdentityReconciliationCandidate(
      baseInput({
        ljd: { incompleteDeleteSuspected: true },
      }),
    );
    expect(result.classification).toBe("reuse_suspected");
    expect(result.claimRecommendation).toBe("review");
    expect(result.proposedActorKeys).toEqual([]);
  });

  it("7. email mismatch evidence never auto-approves", () => {
    const result = classifyIdentityReconciliationCandidate(
      baseInput({
        shadow: { shadowState: "email_mismatch" },
      }),
    );
    expect(result.claimRecommendation).not.toBe("approve");
    expect(result.classification).toBe("needs_operator_review");
    expect(result.proposedActorKeys).toEqual([]);
  });

  it("8. missing snapshot/freeze prevents auto-approve", () => {
    const noEpoch = classifyIdentityReconciliationCandidate(
      baseInput({ snapshotEpoch: null }),
    );
    expect(noEpoch.classification).toBe("needs_operator_review");
    expect(noEpoch.claimRecommendation).toBe("review");
    expect(noEpoch.proposedActorKeys).toEqual([]);

    const unfrozen = classifyIdentityReconciliationCandidate(
      baseInput({
        snapshotEpoch: {
          ...FROZEN_EPOCH,
          emailChangeFrozen: false,
        },
      }),
    );
    expect(unfrozen.classification).toBe("needs_operator_review");
    expect(unfrozen.claimRecommendation).toBe("review");
  });

  it("14. UID-B reuse while claim belongs to UID-A → deny / no plan keys", () => {
    const result = classifyIdentityReconciliationCandidate(
      baseInput({
        firebase: {
          firebaseUid: "uid-b",
          firebaseEmailNormalized: "old@example.com",
          firebaseCreatedAt: "2026-01-01T00:00:00.000Z",
          providerIds: ["password"],
        },
        ljd: {
          legacyEmailNormalized: "old@example.com",
          accountSettingsExists: true,
          profileCount: 1,
          journalEntryCount: 5,
          journalSaveOperationCount: 2,
          rolloutExists: true,
          donguriLedgerCount: 1,
          forestResidentNumberPresent: true,
          incompleteDeleteSuspected: false,
          accountSettingsCreatedAt: "2024-01-01T00:00:00.000Z",
          journalEarliestAt: "2024-01-02T00:00:00.000Z",
          journalLatestAt: "2025-01-01T00:00:00.000Z",
        },
        existingClaim: {
          claimExists: true,
          claimedIdentityId: "identity-a",
          claimedFirebaseUid: "uid-a",
          conflictsWithCandidateUid: true,
        },
      }),
    );
    expect(result.classification).toBe("conflicting_claim");
    expect(result.claimRecommendation).toBe("deny");
    expect(result.proposedActorKeys).toEqual([]);
  });

  it("15. genuinely new UID → firebase_only zero claims", () => {
    const result = classifyIdentityReconciliationCandidate(
      baseInput({
        firebase: {
          firebaseUid: "uid-new",
          firebaseEmailNormalized: "new@example.com",
          firebaseCreatedAt: "2026-08-01T00:00:00.000Z",
          providerIds: ["google.com"],
        },
        ljd: {
          legacyEmailNormalized: "new@example.com",
          accountSettingsExists: false,
          accountSettingsCreatedAt: null,
          profileCount: 0,
          journalEntryCount: 0,
          journalEarliestAt: null,
          journalLatestAt: null,
          journalSaveOperationCount: 0,
          rolloutExists: false,
          donguriLedgerCount: 0,
          forestResidentNumberPresent: false,
          incompleteDeleteSuspected: false,
        },
        shadow: { shadowState: "verified_only" },
      }),
    );
    expect(result.classification).toBe("firebase_only");
    expect(result.claimRecommendation).toBe("none");
    expect(result.proposedActorKeys).toEqual([]);
  });

  it("never auto-claims from current Firebase email without LJD alignment + freeze", () => {
    const result = classifyIdentityReconciliationCandidate(
      baseInput({
        snapshotEpoch: null,
        ljd: {
          legacyEmailNormalized: "a@example.com",
          accountSettingsExists: true,
          profileCount: 1,
          journalEntryCount: 1,
          journalSaveOperationCount: 0,
          rolloutExists: false,
          donguriLedgerCount: 0,
          forestResidentNumberPresent: false,
          incompleteDeleteSuspected: false,
          accountSettingsCreatedAt: null,
          journalEarliestAt: null,
          journalLatestAt: null,
        },
      }),
    );
    expect(result.claimRecommendation).not.toBe("approve");
  });
});

describe("buildLegacyClaimPlan", () => {
  const baseDecision = (
    overrides: Partial<IdentityReconciliationDecision>,
  ): IdentityReconciliationDecision => ({
    decisionId: "d1",
    snapshotEpochId: "epoch-local-test-1",
    firebaseUid: "uid-a",
    emailNormalized: "a@example.com",
    classification: "exact_safe_match",
    decision: "approve_claim",
    decidedActorKeys: ["a@example.com"],
    reasonCodes: ["exact_safe_match"],
    ...overrides,
  });

  it("9. approved decision produces explicit claim plan", () => {
    expect(buildLegacyClaimPlan(baseDecision({}))).toEqual({
      firebaseUid: "uid-a",
      actorKeys: ["a@example.com"],
    });
  });

  it("10. review decision produces no plan", () => {
    expect(
      buildLegacyClaimPlan(
        baseDecision({
          decision: "needs_review",
          classification: "ambiguous",
          decidedActorKeys: ["a@example.com"],
        }),
      ),
    ).toEqual({ firebaseUid: "uid-a", actorKeys: [] });
  });

  it("11. deny decision produces no plan", () => {
    expect(
      buildLegacyClaimPlan(
        baseDecision({
          decision: "deny_claim",
          classification: "conflicting_claim",
          decidedActorKeys: ["old@example.com"],
        }),
      ),
    ).toEqual({ firebaseUid: "uid-a", actorKeys: [] });
  });

  it("12. current Firebase email is never implicitly added", () => {
    const plan = buildLegacyClaimPlan(
      baseDecision({
        emailNormalized: "current@example.com",
        decidedActorKeys: [],
      }),
    );
    expect(plan.actorKeys).toEqual([]);
    expect(plan.actorKeys).not.toContain("current@example.com");
  });

  it("13. duplicate actorKeys deduplicated deterministically", () => {
    expect(
      buildLegacyClaimPlan(
        baseDecision({
          decidedActorKeys: [
            "A@Example.com",
            "a@example.com",
            " b@example.com ",
            "b@example.com",
          ],
        }),
      ).actorKeys,
    ).toEqual(["a@example.com", "b@example.com"]);
  });

  it("no_claim decision produces empty plan", () => {
    expect(
      buildLegacyClaimPlan(
        baseDecision({
          decision: "no_claim",
          classification: "firebase_only",
          decidedActorKeys: [],
        }),
      ).actorKeys,
    ).toEqual([]);
  });
});

describe("identity reconciliation dry-run report", () => {
  it("builds deterministic JSON and CSV from synthetic fixtures", () => {
    const input = baseInput();
    const result = classifyIdentityReconciliationCandidate(input);
    const report = buildIdentityReconciliationReport([{ input, result }]);
    expect(report.formatVersion).toBe(1);
    expect(report.rowCount).toBe(1);
    expect(report.rows[0]!.classification).toBe("exact_safe_match");
    expect(report.rows[0]!.proposedActorKeys).toEqual(["a@example.com"]);

    const csv = identityReconciliationReportToCsv(report);
    expect(csv.split("\n")[0]).toContain("classification");
    expect(csv).toContain("exact_safe_match");
    expect(csv).toContain("a@example.com");
  });
});
