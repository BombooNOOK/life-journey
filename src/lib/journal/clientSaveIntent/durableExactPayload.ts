/**
 * AI-7.1 durable exact-payload persist/load contract.
 *
 * Orchestrators must not call this from Production POST in this phase.
 * Metadata-only intents created before AI-7 stay payload-less (fail-closed).
 */

import type { ClientSaveOperationIntent } from "@/lib/journal/clientSaveIntent/types";
import { CLIENT_SAVE_EXACT_PAYLOAD_VERSION } from "@/lib/journal/clientSaveIntent/types";
import {
  canonicalizeExactJournalSavePayload,
  fingerprintCanonicalJournalSaveRequest,
  parseStoredRequestJson,
  type CanonicalJournalSaveRequest,
} from "@/lib/journal/clientSaveIntent/exactPayloadCanonical";

export type ClientSaveExactPayloadRecord = {
  saveOperationId: string;
  payloadVersion: typeof CLIENT_SAVE_EXACT_PAYLOAD_VERSION;
  requestJson: string;
  requestFingerprint: string;
  requestByteLength: number;
  createdAt: string;
};

export type PersistExactPayloadInput = {
  intent: ClientSaveOperationIntent;
  payload: unknown;
};

export type PersistExactPayloadResult =
  | {
      kind: "created";
      intent: ClientSaveOperationIntent;
      payload: ClientSaveExactPayloadRecord;
    }
  | {
      kind: "already_exists";
      intent: ClientSaveOperationIntent;
      payload: ClientSaveExactPayloadRecord;
    }
  | { kind: "payload_conflict"; intent: ClientSaveOperationIntent }
  | { kind: "intent_without_payload"; intent: ClientSaveOperationIntent }
  | {
      kind: "rejected";
      code: ReturnType<typeof canonicalizeExactJournalSavePayload> extends infer T
        ? T extends { ok: false; code: infer C }
          ? C
          : never
        : never;
    }
  | { kind: "rejected"; code: "fingerprint_mismatch" };

export type LoadExactPayloadResult =
  | {
      kind: "ok";
      payload: ClientSaveExactPayloadRecord;
      request: CanonicalJournalSaveRequest;
    }
  | { kind: "missing" }
  | { kind: "fingerprint_mismatch"; payload: ClientSaveExactPayloadRecord }
  | { kind: "corrupt" };

export type ExactPayloadTransaction = {
  findIntent(saveOperationId: string): Promise<ClientSaveOperationIntent | null>;
  insertIntent(intent: ClientSaveOperationIntent): Promise<void>;
  findPayload(saveOperationId: string): Promise<ClientSaveExactPayloadRecord | null>;
  insertPayload(row: ClientSaveExactPayloadRecord): Promise<void>;
};

export async function applyPersistPreparedIntentWithExactPayload(
  tx: ExactPayloadTransaction,
  input: PersistExactPayloadInput,
): Promise<PersistExactPayloadResult> {
  if (input.payload === null || typeof input.payload !== "object" || Array.isArray(input.payload)) {
    return { kind: "rejected", code: "content_invalid" };
  }
  const canonical = canonicalizeExactJournalSavePayload({
    saveOperationId: input.intent.saveOperationId,
    payload: {
      ...(input.payload as Record<string, unknown>),
      saveOperationId: input.intent.saveOperationId,
    },
  });
  if (!canonical.ok) return { kind: "rejected", code: canonical.code };

  if (input.intent.requestFingerprint !== canonical.requestFingerprint) {
    return { kind: "rejected", code: "fingerprint_mismatch" };
  }

  const existingIntent = await tx.findIntent(input.intent.saveOperationId);
  const existingPayload = existingIntent
    ? await tx.findPayload(input.intent.saveOperationId)
    : null;

  if (existingIntent && !existingPayload) {
    return { kind: "intent_without_payload", intent: existingIntent };
  }

  if (existingIntent && existingPayload) {
    if (
      existingPayload.requestJson === canonical.requestJson &&
      existingPayload.requestFingerprint === canonical.requestFingerprint &&
      existingIntent.requestFingerprint === canonical.requestFingerprint
    ) {
      return {
        kind: "already_exists",
        intent: existingIntent,
        payload: existingPayload,
      };
    }
    return { kind: "payload_conflict", intent: existingIntent };
  }

  const payloadRow: ClientSaveExactPayloadRecord = {
    saveOperationId: input.intent.saveOperationId,
    payloadVersion: CLIENT_SAVE_EXACT_PAYLOAD_VERSION,
    requestJson: canonical.requestJson,
    requestFingerprint: canonical.requestFingerprint,
    requestByteLength: canonical.requestByteLength,
    createdAt: input.intent.createdAt,
  };
  await tx.insertIntent(input.intent);
  await tx.insertPayload(payloadRow);
  return { kind: "created", intent: input.intent, payload: payloadRow };
}

export function verifyLoadedExactPayload(
  record: ClientSaveExactPayloadRecord,
  intentFingerprint?: string,
): LoadExactPayloadResult {
  const request = parseStoredRequestJson(record.requestJson);
  if (!request) return { kind: "corrupt" };
  const recomputed = fingerprintCanonicalJournalSaveRequest(request);
  if (
    recomputed !== record.requestFingerprint ||
    (intentFingerprint !== undefined && intentFingerprint !== recomputed)
  ) {
    return { kind: "fingerprint_mismatch", payload: record };
  }
  return { kind: "ok", payload: record, request };
}

export type DeleteExactPayloadResult =
  | { kind: "deleted"; saveOperationId: string }
  | { kind: "already_absent"; saveOperationId: string }
  | {
      kind: "blocked";
      reason: "intent_missing" | "actor_mismatch" | "intent_not_completed";
      saveOperationId: string;
      status?: ClientSaveOperationIntent["status"];
    };

export type ExactPayloadCleanupTransaction = {
  findIntent(saveOperationId: string): Promise<ClientSaveOperationIntent | null>;
  findPayload(saveOperationId: string): Promise<ClientSaveExactPayloadRecord | null>;
  deletePayload(saveOperationId: string): Promise<void>;
};

/**
 * Deletes one exact payload row after local completion is durable.
 * Never deletes the intent row, JournalEntry, or any other operation's payload.
 */
export async function applyDeleteExactPayloadIfCompleted(
  tx: ExactPayloadCleanupTransaction,
  input: { actorKey: string; saveOperationId: string },
): Promise<DeleteExactPayloadResult> {
  const intent = await tx.findIntent(input.saveOperationId);
  if (!intent) {
    return { kind: "blocked", reason: "intent_missing", saveOperationId: input.saveOperationId };
  }
  if (intent.actorKey !== input.actorKey) {
    return {
      kind: "blocked",
      reason: "actor_mismatch",
      saveOperationId: input.saveOperationId,
      status: intent.status,
    };
  }
  if (intent.status !== "completed" || !intent.serverEntryId) {
    // pending / processing / recovery_required / failed_final / unbound
    // server_completed keep the payload. failed_final is retained this phase
    // so a later user review can still inspect the exact body/photo.
    return {
      kind: "blocked",
      reason: "intent_not_completed",
      saveOperationId: input.saveOperationId,
      status: intent.status,
    };
  }
  const payload = await tx.findPayload(input.saveOperationId);
  if (!payload) {
    return { kind: "already_absent", saveOperationId: input.saveOperationId };
  }
  await tx.deletePayload(input.saveOperationId);
  return { kind: "deleted", saveOperationId: input.saveOperationId };
}
