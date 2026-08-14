/**
 * 4B-4AI-1 protocol boundary for capability and same-operation lookup.
 *
 * New operation admission requires global gate AND an enabled, supported
 * account rollout row. Lookup deliberately remains available to an
 * authenticated operation owner after rollout revocation, so a pending
 * operation can be recovered safely without starting a new one.
 */

import { timingSafeEqual } from "node:crypto";

export const JOURNAL_SAVE_IDEMPOTENCY_PROTOCOL_VERSION = 1 as const;

export type SaveCapabilityResponse = {
  protocolVersion: typeof JOURNAL_SAVE_IDEMPOTENCY_PROTOCOL_VERSION;
  idempotentSaveEnabled: boolean;
  lookupSupported: boolean;
  foregroundRecoverySupported: boolean;
  automaticBackgroundRetry: false;
};

export type RolloutRow = {
  enabled: boolean;
  protocolVersion: number;
};

export function disabledSaveCapability(): SaveCapabilityResponse {
  return {
    protocolVersion: JOURNAL_SAVE_IDEMPOTENCY_PROTOCOL_VERSION,
    idempotentSaveEnabled: false,
    lookupSupported: false,
    foregroundRecoverySupported: false,
    automaticBackgroundRetry: false,
  };
}

export function resolveSaveCapability(input: {
  globalEnabled: boolean;
  rollout: RolloutRow | null;
}): SaveCapabilityResponse {
  const enabled =
    input.globalEnabled &&
    input.rollout?.enabled === true &&
    input.rollout.protocolVersion === JOURNAL_SAVE_IDEMPOTENCY_PROTOCOL_VERSION;
  return {
    protocolVersion: JOURNAL_SAVE_IDEMPOTENCY_PROTOCOL_VERSION,
    idempotentSaveEnabled: enabled,
    lookupSupported: enabled,
    foregroundRecoverySupported: enabled,
    automaticBackgroundRetry: false,
  };
}

export type PublicSaveOperationLookup =
  | { protocolVersion: 1; state: "not_found" }
  | { protocolVersion: 1; state: "processing" }
  | { protocolVersion: 1; state: "completed"; entryId: string }
  | {
      protocolVersion: 1;
      state: "failed_final";
      errorCategory: "acorn" | "server";
    }
  | { protocolVersion: 1; state: "fingerprint_mismatch" };

export function fingerprintsMatch(expected: string, supplied: string): boolean {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(supplied, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

function publicErrorCategory(
  resultCode: string | null,
): "acorn" | "server" {
  return resultCode === "ACORN_INSUFFICIENT" ? "acorn" : "server";
}

export function toPublicSaveOperationLookup(input: {
  row:
    | {
        status: string;
        journalEntryId: string | null;
        requestFingerprint: string;
        resultCode: string | null;
      }
    | null;
  suppliedFingerprint: string;
}): PublicSaveOperationLookup {
  if (!input.row) {
    return { protocolVersion: 1, state: "not_found" };
  }
  if (!fingerprintsMatch(input.row.requestFingerprint, input.suppliedFingerprint)) {
    return { protocolVersion: 1, state: "fingerprint_mismatch" };
  }
  if (input.row.status === "completed" && input.row.journalEntryId) {
    return {
      protocolVersion: 1,
      state: "completed",
      entryId: input.row.journalEntryId,
    };
  }
  if (input.row.status === "failed_final") {
    return {
      protocolVersion: 1,
      state: "failed_final",
      errorCategory: publicErrorCategory(input.row.resultCode),
    };
  }
  // Intentionally collapse all server checkpoints / unknown in-progress states.
  return { protocolVersion: 1, state: "processing" };
}
