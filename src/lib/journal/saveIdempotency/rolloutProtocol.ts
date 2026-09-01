/**
 * 4B-4AI-1 protocol boundary for capability and same-operation lookup.
 *
 * New operation admission requires global gate AND an enabled, supported
 * account rollout row. Lookup deliberately remains available to an
 * authenticated operation owner after rollout revocation, so a pending
 * operation can be recovered safely without starting a new one.
 *
 * AI-X6.8B0.6: retains Production POST eligibility helpers from 2f21ade
 * and stableActorAdmission from 378a675.
 */

import { timingSafeEqual } from "node:crypto";

export const JOURNAL_SAVE_IDEMPOTENCY_PROTOCOL_VERSION = 1 as const;

export type SaveCapabilityResponse = {
  protocolVersion: typeof JOURNAL_SAVE_IDEMPOTENCY_PROTOCOL_VERSION;
  idempotentSaveEnabled: boolean;
  lookupSupported: boolean;
  foregroundRecoverySupported: boolean;
  automaticBackgroundRetry: false;
  /**
   * AI-X6.8A3: actor-specific stable native pending admission.
   * true only when idempotent admission is enabled AND the resolved write
   * actor is canonical firebase:<UID> (stable-write authority ON + bound identity).
   * Legacy email rollout rows never produce stable admission.
   */
  stableActorAdmission: boolean;
};

/** Resolved write-actor mode for capability (server-side only). */
export type SaveCapabilityWriteActorMode = "legacy" | "stable";

export type RolloutRow = {
  enabled: boolean;
  protocolVersion: number;
};

/**
 * Authoritative new-operation admission predicate.
 * Both capability and Journal POST call this to prevent advisory/POST drift.
 */
export function isJournalSaveIdempotencyRolloutEligible(input: {
  globalEnabled: boolean;
  rollout: RolloutRow | null;
}): boolean {
  return (
    input.globalEnabled &&
    input.rollout?.enabled === true &&
    input.rollout.protocolVersion === JOURNAL_SAVE_IDEMPOTENCY_PROTOCOL_VERSION
  );
}

/**
 * Server-side eligibility resolver for both advisory capability and
 * authoritative POST admission. A failed rollout read is intentionally false.
 */
export async function resolveJournalSaveIdempotencyRolloutEligibility(input: {
  globalEnabled: boolean;
  actorKey: string;
  loadRollout: (actorKey: string) => Promise<RolloutRow | null>;
}): Promise<boolean> {
  if (!input.globalEnabled) return false;
  try {
    const rollout = await input.loadRollout(input.actorKey);
    return isJournalSaveIdempotencyRolloutEligible({
      globalEnabled: true,
      rollout,
    });
  } catch {
    return false;
  }
}

export function disabledSaveCapability(): SaveCapabilityResponse {
  return {
    protocolVersion: JOURNAL_SAVE_IDEMPOTENCY_PROTOCOL_VERSION,
    idempotentSaveEnabled: false,
    lookupSupported: false,
    foregroundRecoverySupported: false,
    automaticBackgroundRetry: false,
    stableActorAdmission: false,
  };
}

/**
 * Stable native pending is admitted only when idempotent protocol is enabled
 * for a canonical firebase write actor (never from legacy email rollout alone).
 */
export function resolveStableActorAdmission(input: {
  idempotentSaveEnabled: boolean;
  writeActorMode: SaveCapabilityWriteActorMode;
}): boolean {
  return input.idempotentSaveEnabled && input.writeActorMode === "stable";
}

export function resolveSaveCapability(input: {
  globalEnabled: boolean;
  rollout: RolloutRow | null;
  writeActorMode?: SaveCapabilityWriteActorMode;
}): SaveCapabilityResponse {
  const enabled = isJournalSaveIdempotencyRolloutEligible(input);
  const writeActorMode = input.writeActorMode ?? "legacy";
  const stableActorAdmission = resolveStableActorAdmission({
    idempotentSaveEnabled: enabled,
    writeActorMode,
  });
  return {
    protocolVersion: JOURNAL_SAVE_IDEMPOTENCY_PROTOCOL_VERSION,
    idempotentSaveEnabled: enabled,
    lookupSupported: enabled,
    foregroundRecoverySupported: enabled,
    automaticBackgroundRetry: false,
    stableActorAdmission,
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
