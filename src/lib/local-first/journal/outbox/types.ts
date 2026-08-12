/**
 * Transitional Local mirror outbox (4B-4I).
 * Operational metadata only — never journal body / photo / secrets.
 * Not Source-of-Truth. Not wired to production Journal save.
 */

import type { ResolvedLocalJournalGeneration } from "@/lib/local-first/journal/generation/ResolvedLocalJournalGeneration";

/** PoC DB name under Application Support (SQLCipher). Formal production name TBD. */
export const LOCAL_MIRROR_OUTBOX_POC_DB_NAME = "ljd_local_mirror_outbox_poc" as const;

export const LOCAL_MIRROR_OUTBOX_SCHEMA_VERSION = 1 as const;

/**
 * Opaque generation identity for outbox uniqueness / pin.
 * Until a ULID registry exists, databaseId is the stable technical key
 * (not a user-facing "g1/g2" product label).
 */
export function opaqueGenerationIdFromResolved(
  target: Pick<ResolvedLocalJournalGeneration, "databaseId">,
): string {
  return target.databaseId;
}

/** Durable lastResult / attempt outcome labels (non-PII). */
export type OutboxLastResult =
  | "retry_needed"
  | "attention_required"
  | "source_missing"
  | "generation_changed"
  | "target_unavailable"
  | "failed"
  | "mirrored"
  | "already_present"
  | null;

export type LocalMirrorOutboxItem = {
  id: string;
  serverEntryId: string;
  targetGenerationId: string;
  /** Non-secret snapshot so retry can verify identity without registry. */
  targetDatabaseId: string;
  targetMediaRootId: string;
  targetSchemaVersion: number;
  manifestChecksumAtEnqueue: string;
  requestedAt: string;
  retryCount: number;
  lastResult: OutboxLastResult;
  lastAttemptAt: string | null;
  createdAt: string;
};

export type EnqueueInput = {
  serverEntryId: string;
  target: ResolvedLocalJournalGeneration;
  /** Optional fixed clock for tests. */
  now?: string;
  /** Optional fixed id for tests. */
  id?: string;
};

export type EnqueueResult = {
  item: LocalMirrorOutboxItem;
  /** False when unique(serverEntryId, targetGenerationId) already existed. */
  created: boolean;
};

export type OutboxAttemptOutcome =
  | {
      kind: "acked";
      mirrorStatus: "mirrored" | "already_present";
      itemId: string;
    }
  | {
      kind: "retained";
      lastResult: Exclude<OutboxLastResult, null | "mirrored" | "already_present">;
      item: LocalMirrorOutboxItem;
      detail: string;
    }
  | {
      kind: "blocked";
      lastResult: "generation_changed" | "target_unavailable" | "failed";
      item: LocalMirrorOutboxItem | null;
      detail: string;
    };

/** Fields forbidden in outbox persistence (defense-in-depth for tests). */
export const OUTBOX_FORBIDDEN_PERSISTED_KEYS = [
  "content",
  "body",
  "photo",
  "photoBase64",
  "photoDataUrl",
  "caption",
  "email",
  "passphrase",
  "password",
  "secret",
  "cookie",
] as const;
