/**
 * Dry-run / operator report builders for identity reconciliation (AI-8.3b1).
 *
 * Deterministic serializable output for local fixtures only.
 * Not a Production export. Do not emit through normal app runtime logs.
 */

import type {
  IdentityReconciliationCandidateInput,
  IdentityReconciliationClassifyResult,
} from "@/lib/auth/identityReconciliation/types";

export type IdentityReconciliationReportRow = {
  snapshotEpochId: string | null;
  /** Operator artifact may include UID; never for public product APIs. */
  firebaseUid: string | null;
  /** Normalized email for operator artifact (synthetic in tests). */
  emailNormalized: string | null;
  classification: string;
  claimRecommendation: string;
  claimability: string;
  reviewNeeded: boolean;
  conflictIndicator: boolean;
  proposedActorKeys: string[];
  reasons: string[];
  evidenceSummary: string[];
};

export type IdentityReconciliationReport = {
  formatVersion: 1;
  kind: "identity_reconciliation_dry_run";
  rowCount: number;
  rows: IdentityReconciliationReportRow[];
};

function resolveEmail(
  input: IdentityReconciliationCandidateInput,
): string | null {
  return (
    input.ljd.legacyEmailNormalized ??
    input.firebase.firebaseEmailNormalized ??
    null
  );
}

export function buildIdentityReconciliationReportRow(
  input: IdentityReconciliationCandidateInput,
  result: IdentityReconciliationClassifyResult,
): IdentityReconciliationReportRow {
  return {
    snapshotEpochId: input.snapshotEpoch?.snapshotEpochId ?? null,
    firebaseUid: input.firebase.firebaseUid,
    emailNormalized: resolveEmail(input),
    classification: result.classification,
    claimRecommendation: result.claimRecommendation,
    claimability: result.claimability,
    reviewNeeded:
      result.claimRecommendation === "review" ||
      result.claimability === "REVIEW_REQUIRED",
    conflictIndicator: result.classification === "conflicting_claim",
    proposedActorKeys: [...result.proposedActorKeys],
    reasons: [...result.reasons],
    evidenceSummary: [...result.evidenceSummary],
  };
}

export function buildIdentityReconciliationReport(
  entries: ReadonlyArray<{
    input: IdentityReconciliationCandidateInput;
    result: IdentityReconciliationClassifyResult;
  }>,
): IdentityReconciliationReport {
  const rows = entries.map(({ input, result }) =>
    buildIdentityReconciliationReportRow(input, result),
  );
  return {
    formatVersion: 1,
    kind: "identity_reconciliation_dry_run",
    rowCount: rows.length,
    rows,
  };
}

const CSV_COLUMNS = [
  "snapshotEpochId",
  "firebaseUid",
  "emailNormalized",
  "classification",
  "claimRecommendation",
  "claimability",
  "reviewNeeded",
  "conflictIndicator",
  "proposedActorKeys",
  "reasons",
] as const;

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

/** Deterministic CSV for operator dry-run (local/synthetic fixtures). */
export function identityReconciliationReportToCsv(
  report: IdentityReconciliationReport,
): string {
  const header = CSV_COLUMNS.join(",");
  const lines = report.rows.map((row) =>
    [
      row.snapshotEpochId ?? "",
      row.firebaseUid ?? "",
      row.emailNormalized ?? "",
      row.classification,
      row.claimRecommendation,
      row.claimability,
      row.reviewNeeded ? "true" : "false",
      row.conflictIndicator ? "true" : "false",
      row.proposedActorKeys.join("|"),
      row.reasons.join("|"),
    ]
      .map((v) => csvEscape(String(v)))
      .join(","),
  );
  return [header, ...lines].join("\n");
}
