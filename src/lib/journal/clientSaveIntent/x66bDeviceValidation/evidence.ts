/**
 * PII-safe evidence for X6.6B device validation.
 * Never stores email, raw UID, tokens, or journal body.
 */

import { sha256HexSync } from "@/lib/crypto/sha256HexSync";
import { isFirebaseActorKey } from "@/lib/auth/firebaseActorKey";
import { X66B_EVIDENCE_STORAGE_KEY } from "@/lib/journal/clientSaveIntent/x66bDeviceValidation/constants";
import { isNativeStablePendingIntentEnabled } from "@/lib/journal/clientSaveIntent/nativeStablePendingIntentGate";

export type X66bAuthAlias = "UID-A" | "UID-B" | "SIGNED_OUT" | "LOADING" | "AUTH_REQUIRED";

export type X66bStableActorClass = "firebase" | "legacy" | "null";

export type X66bEvidenceStage =
  | "IDLE"
  | "AUTH_WAIT"
  | "READY"
  | "CREATE_PENDING"
  | "PENDING_DURABLE"
  | "POST_BEGIN"
  | "PENDING_PERSISTED"
  | "INTERRUPTION_READY"
  | "RECOVERY_WAIT"
  | "RECOVERING"
  | "COMPLETED"
  | "FAILED"
  | "AUTH_REQUIRED"
  | "HARNESS_OFF"
  | "SECOND_RESTART_NO_REPLAY";

export type X66bEvidencePhase = {
  stage: X66bEvidenceStage;
  at: string;
  authAlias?: X66bAuthAlias;
  stableGate?: boolean;
  stableActorClass?: X66bStableActorClass;
  saveOperationIdAlias?: string;
  payloadHash?: string;
  intentStatus?: string;
  pendingCount?: number;
  persistBeforePostOk?: boolean | null;
  resultKind?: string;
  note?: string;
};

export type X66bValidationEvidence = {
  version: 1;
  phases: X66bEvidencePhase[];
  uidAliasMap: Record<string, "UID-A" | "UID-B">;
  lastSaveOperationIdAlias: string | null;
  lastPayloadHash: string | null;
  duplicateSaveDetected: boolean;
  persistBeforePostOk: boolean | null;
};

export function emptyX66bEvidence(): X66bValidationEvidence {
  return {
    version: 1,
    phases: [],
    uidAliasMap: {},
    lastSaveOperationIdAlias: null,
    lastPayloadHash: null,
    duplicateSaveDetected: false,
    persistBeforePostOk: null,
  };
}

/** Short non-reversible alias for saveOperationId (never the raw id). */
export function aliasSaveOperationId(saveOperationId: string): string {
  return sha256HexSync(`x66b-opid:${saveOperationId}`).slice(0, 16);
}

function uidFingerprint(uid: string): string {
  return sha256HexSync(`x66b-uid:${uid}`).slice(0, 16);
}

export function resolveAuthAlias(
  evidence: X66bValidationEvidence,
  input: { authLoading: boolean; firebaseUid: string | null },
): X66bAuthAlias {
  if (input.authLoading) return "LOADING";
  if (!input.firebaseUid) return "SIGNED_OUT";
  const fp = uidFingerprint(input.firebaseUid);
  const existing = evidence.uidAliasMap[fp];
  if (existing) return existing;
  const assigned: "UID-A" | "UID-B" =
    Object.keys(evidence.uidAliasMap).length === 0 ? "UID-A" : "UID-B";
  evidence.uidAliasMap[fp] = assigned;
  return assigned;
}

export function classifyStableActorKey(
  stableActorKey: string | null | undefined,
): X66bStableActorClass {
  if (stableActorKey == null || stableActorKey === "") return "null";
  if (isFirebaseActorKey(stableActorKey)) return "firebase";
  return "legacy";
}

export function appendEvidencePhase(
  evidence: X66bValidationEvidence,
  phase: Omit<X66bEvidencePhase, "at"> & { at?: string },
): X66bValidationEvidence {
  const next: X66bValidationEvidence = {
    ...evidence,
    phases: [
      ...evidence.phases,
      {
        ...phase,
        at: phase.at ?? new Date().toISOString(),
        stableGate: phase.stableGate ?? isNativeStablePendingIntentEnabled(),
      },
    ],
    uidAliasMap: { ...evidence.uidAliasMap },
  };
  if (phase.saveOperationIdAlias) {
    next.lastSaveOperationIdAlias = phase.saveOperationIdAlias;
  }
  if (phase.payloadHash) {
    next.lastPayloadHash = phase.payloadHash;
  }
  if (typeof phase.persistBeforePostOk === "boolean") {
    next.persistBeforePostOk = phase.persistBeforePostOk;
  }
  return next;
}

/** Assert evidence JSON never contains raw email/uid patterns from known inputs. */
export function assertEvidenceRedacted(
  evidence: X66bValidationEvidence,
  secrets: { emails?: string[]; uids?: string[]; payloads?: string[] },
): { ok: true } | { ok: false; leak: string } {
  const blob = JSON.stringify(evidence);
  for (const email of secrets.emails ?? []) {
    if (email && blob.includes(email)) return { ok: false, leak: "email" };
  }
  for (const uid of secrets.uids ?? []) {
    if (uid && blob.includes(uid)) return { ok: false, leak: "uid" };
  }
  for (const payload of secrets.payloads ?? []) {
    if (payload && payload.length > 8 && blob.includes(payload)) {
      return { ok: false, leak: "payload" };
    }
  }
  if (blob.includes("Bearer ") || blob.includes("idToken")) {
    return { ok: false, leak: "token" };
  }
  return { ok: true };
}

export function loadEvidenceFromStorage(
  storage: Pick<Storage, "getItem"> | null | undefined = typeof localStorage !== "undefined"
    ? localStorage
    : null,
): X66bValidationEvidence {
  if (!storage) return emptyX66bEvidence();
  try {
    const raw = storage.getItem(X66B_EVIDENCE_STORAGE_KEY);
    if (!raw) return emptyX66bEvidence();
    const parsed = JSON.parse(raw) as X66bValidationEvidence;
    if (parsed?.version !== 1 || !Array.isArray(parsed.phases)) {
      return emptyX66bEvidence();
    }
    return {
      ...emptyX66bEvidence(),
      ...parsed,
      phases: parsed.phases,
      uidAliasMap: parsed.uidAliasMap ?? {},
    };
  } catch {
    return emptyX66bEvidence();
  }
}

export function saveEvidenceToStorage(
  evidence: X66bValidationEvidence,
  storage: Pick<Storage, "setItem"> | null | undefined = typeof localStorage !== "undefined"
    ? localStorage
    : null,
): void {
  if (!storage) return;
  try {
    storage.setItem(X66B_EVIDENCE_STORAGE_KEY, JSON.stringify(evidence));
  } catch {
    /* quota / private mode */
  }
}

export function clearEvidenceStorage(
  storage: Pick<Storage, "removeItem"> | null | undefined = typeof localStorage !== "undefined"
    ? localStorage
    : null,
): void {
  if (!storage) return;
  try {
    storage.removeItem(X66B_EVIDENCE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
