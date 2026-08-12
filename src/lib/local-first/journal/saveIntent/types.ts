/**
 * Local durable Save Operation Intent (4B-4O PoC).
 * Operational metadata only — separate from mirror outbox.
 * Never stores journal body / photo / caption / secrets / auth tokens.
 * Not wired to production POST /api/journal.
 */

import type { EnqueueInput } from "@/lib/local-first/journal/outbox/types";
import type { ResolvedLocalJournalGeneration } from "@/lib/local-first/journal/generation/ResolvedLocalJournalGeneration";
import type { GetJournalSaveOperationResult } from "@/lib/journal/saveIdempotency/types";

/** PoC DB name under Application Support (SQLCipher). */
export const LOCAL_SAVE_OPERATION_INTENT_POC_DB_NAME =
  "ljd_local_save_operation_intent_poc" as const;

export const LOCAL_SAVE_OPERATION_INTENT_SCHEMA_VERSION = 1 as const;

/**
 * Actor key for Local intent isolation.
 * Audit (4B-4O): journal ownership is cookie/DB email, not Firebase UID.
 * Align with Server PoC userId = normalized viewer email.
 */
export function actorKeyFromViewerEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type LocalSaveOperationIntentStatus =
  | "prepared"
  | "awaiting_result"
  | "server_completed"
  | "completed"
  | "server_failed_final"
  | "recovery_required";

export type LocalSaveOperationIntentFailureCode =
  | "ACORN_INSUFFICIENT"
  | "IDEMPOTENCY_CONFLICT"
  | "INTERNAL"
  | "PAYLOAD_UNAVAILABLE"
  | "LOOKUP_FAILED_FINAL"
  | null;

export type LocalSaveOperationIntentRecord = {
  intentId: string;
  saveOperationId: string;
  /** Normalized viewer email (matches Server JournalSaveOperation.userId). */
  actorKey: string;
  status: LocalSaveOperationIntentStatus;
  serverEntryId: string | null;
  requestFingerprint: string;
  /**
   * Optional draft reference. Audit: no attempt-scoped durable draft exists
   * that safely restores content+photo; when null or unresolvable → recovery_required
   * on lookup not_found (do not auto-POST empty payload).
   */
  draftRef: string | null;
  createdAt: string;
  lastAttemptAt: string | null;
  completedAt: string | null;
  failureCode: LocalSaveOperationIntentFailureCode;
};

export type PrepareSaveOperationIntentInput = {
  actorKey: string;
  saveOperationId: string;
  requestFingerprint: string;
  draftRef?: string | null;
  now?: string;
  intentId?: string;
};

export type PrepareSaveOperationIntentResult =
  | { kind: "created"; intent: LocalSaveOperationIntentRecord }
  | { kind: "existing"; intent: LocalSaveOperationIntentRecord }
  | {
      kind: "fingerprint_conflict";
      intent: LocalSaveOperationIntentRecord;
      detail: string;
    };

/** Candidate for existing mirror outbox enqueue — not auto-connected to production. */
export type MirrorEnqueueCandidate = {
  enqueueInput: EnqueueInput;
  fromIntentId: string;
  saveOperationId: string;
};

export type ApplyLookupOutcome =
  | {
      kind: "awaiting_result";
      intent: LocalSaveOperationIntentRecord;
      detail: "processing" | "not_found_retryable";
    }
  | {
      kind: "server_completed";
      intent: LocalSaveOperationIntentRecord;
      serverEntryId: string;
      mirrorEnqueueCandidate: MirrorEnqueueCandidate | null;
    }
  | {
      kind: "server_failed_final";
      intent: LocalSaveOperationIntentRecord;
    }
  | {
      kind: "recovery_required";
      intent: LocalSaveOperationIntentRecord;
      detail: string;
    }
  | {
      kind: "completed";
      intent: LocalSaveOperationIntentRecord;
      reusedMirror: boolean;
    }
  | {
      kind: "fingerprint_conflict";
      intent: LocalSaveOperationIntentRecord;
    };

export type LocalSaveOperationIntentStore = {
  findBySaveOperationId(
    saveOperationId: string,
  ): Promise<LocalSaveOperationIntentRecord | null>;
  findByActorAndSaveOperationId(
    actorKey: string,
    saveOperationId: string,
  ): Promise<LocalSaveOperationIntentRecord | null>;
  tryInsert(
    row: LocalSaveOperationIntentRecord,
  ): Promise<
    | { created: true; row: LocalSaveOperationIntentRecord }
    | { created: false; row: LocalSaveOperationIntentRecord }
  >;
  update(
    row: LocalSaveOperationIntentRecord,
  ): Promise<LocalSaveOperationIntentRecord>;
  listByActor(actorKey: string): Promise<LocalSaveOperationIntentRecord[]>;
  dumpRows(): Promise<LocalSaveOperationIntentRecord[]>;
};

/** Port: resolve draft payload for not_found retry — must not invent empty body. */
export type DraftPayloadResolver = {
  canResolvePayload(draftRef: string | null): Promise<boolean>;
};

/** Port: resolve healthy technical_active generation at enqueue time (not stored on Server op). */
export type GenerationTargetResolver = {
  resolveHealthyTechnicalActive(): Promise<
    | { ok: true; target: ResolvedLocalJournalGeneration }
    | { ok: false; detail: string }
  >;
};

export type OperationLookupPort = {
  getJournalSaveOperationResult(input: {
    userId: string;
    saveOperationId: string;
  }): Promise<GetJournalSaveOperationResult>;
};

export const SAVE_INTENT_FORBIDDEN_PERSISTED_KEYS = [
  "content",
  "body",
  "photo",
  "photoBase64",
  "photoDataUrl",
  "caption",
  "passphrase",
  "password",
  "secret",
  "cookie",
  "token",
] as const;
