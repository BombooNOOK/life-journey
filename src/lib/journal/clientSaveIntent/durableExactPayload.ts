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
