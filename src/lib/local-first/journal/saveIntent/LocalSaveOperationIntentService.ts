/**
 * Application service: durable Local save-operation intent (4B-4O).
 *
 * Order (mandatory):
 *   generate saveOperationId → durable intent write → (later) Server POST
 * Never POST before intent is durable.
 *
 * Mirror outbox is separate — this service only builds enqueue *candidates*.
 */

import type { GetJournalSaveOperationResult } from "@/lib/journal/saveIdempotency/types";
import type { ResolvedLocalJournalGeneration } from "@/lib/local-first/journal/generation/ResolvedLocalJournalGeneration";
import type {
  ApplyLookupOutcome,
  DraftPayloadResolver,
  GenerationTargetResolver,
  LocalSaveOperationIntentRecord,
  LocalSaveOperationIntentStore,
  MirrorEnqueueCandidate,
  OperationLookupPort,
  PrepareSaveOperationIntentInput,
  PrepareSaveOperationIntentResult,
} from "@/lib/local-first/journal/saveIntent/types";

function newIntentId(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return `intent_${[...arr].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

export async function prepareSaveOperationIntent(
  store: LocalSaveOperationIntentStore,
  input: PrepareSaveOperationIntentInput,
): Promise<PrepareSaveOperationIntentResult> {
  const actorKey = input.actorKey.trim().toLowerCase();
  const saveOperationId = input.saveOperationId.trim();
  const requestFingerprint = input.requestFingerprint.trim();
  if (!actorKey) throw new Error("actorKey_required");
  if (!saveOperationId) throw new Error("saveOperationId_required");
  if (!requestFingerprint) throw new Error("requestFingerprint_required");

  const now = input.now ?? new Date().toISOString();
  const candidate: LocalSaveOperationIntentRecord = {
    intentId: input.intentId ?? newIntentId(),
    saveOperationId,
    actorKey,
    status: "prepared",
    serverEntryId: null,
    requestFingerprint,
    draftRef: input.draftRef ?? null,
    createdAt: now,
    lastAttemptAt: null,
    completedAt: null,
    failureCode: null,
  };

  const inserted = await store.tryInsert(candidate);
  if (!inserted.created) {
    const existing = inserted.row;
    if (existing.actorKey !== actorKey) {
      // Same saveOperationId claimed by another actor — treat as conflict.
      return {
        kind: "fingerprint_conflict",
        intent: existing,
        detail: "cross_actor_operation_id",
      };
    }
    if (existing.requestFingerprint !== requestFingerprint) {
      return {
        kind: "fingerprint_conflict",
        intent: existing,
        detail: "same_operation_id_incompatible_fingerprint",
      };
    }
    return { kind: "existing", intent: existing };
  }
  return { kind: "created", intent: inserted.row };
}

/** Mark that a Server POST attempt is in flight (intent must already be durable). */
export async function markSaveOperationPostAttempted(
  store: LocalSaveOperationIntentStore,
  input: { actorKey: string; saveOperationId: string; now?: string },
): Promise<LocalSaveOperationIntentRecord> {
  const row = await store.findByActorAndSaveOperationId(
    input.actorKey.trim().toLowerCase(),
    input.saveOperationId.trim(),
  );
  if (!row) throw new Error("intent_missing");
  if (row.status === "completed" || row.status === "server_failed_final") {
    return row;
  }
  if (row.status === "recovery_required") {
    return row;
  }
  const now = input.now ?? new Date().toISOString();
  return store.update({
    ...row,
    status: "awaiting_result",
    lastAttemptAt: now,
  });
}

function buildMirrorCandidate(
  intent: LocalSaveOperationIntentRecord,
  serverEntryId: string,
  target: ResolvedLocalJournalGeneration,
): MirrorEnqueueCandidate {
  return {
    fromIntentId: intent.intentId,
    saveOperationId: intent.saveOperationId,
    enqueueInput: {
      serverEntryId,
      target,
    },
  };
}

export async function applyOperationLookupToIntent(
  store: LocalSaveOperationIntentStore,
  ports: {
    lookup: OperationLookupPort;
    draftResolver: DraftPayloadResolver;
    generationResolver: GenerationTargetResolver;
  },
  input: {
    actorKey: string;
    saveOperationId: string;
    requestFingerprint: string;
    now?: string;
  },
): Promise<ApplyLookupOutcome> {
  const actorKey = input.actorKey.trim().toLowerCase();
  const saveOperationId = input.saveOperationId.trim();
  const intent = await store.findByActorAndSaveOperationId(actorKey, saveOperationId);
  if (!intent) throw new Error("intent_missing");

  if (intent.requestFingerprint !== input.requestFingerprint.trim()) {
    return { kind: "fingerprint_conflict", intent };
  }

  if (intent.status === "completed" && intent.serverEntryId) {
    return { kind: "completed", intent, reusedMirror: true };
  }

  if (intent.status === "server_failed_final") {
    return { kind: "server_failed_final", intent };
  }

  if (intent.status === "recovery_required") {
    return {
      kind: "recovery_required",
      intent,
      detail: intent.failureCode ?? "PAYLOAD_UNAVAILABLE",
    };
  }

  const result = await ports.lookup.getJournalSaveOperationResult({
    userId: actorKey,
    saveOperationId,
  });

  return applyLookupResult(store, ports, intent, result, input.now);
}

async function applyLookupResult(
  store: LocalSaveOperationIntentStore,
  ports: {
    draftResolver: DraftPayloadResolver;
    generationResolver: GenerationTargetResolver;
  },
  intent: LocalSaveOperationIntentRecord,
  result: GetJournalSaveOperationResult,
  nowIso?: string,
): Promise<ApplyLookupOutcome> {
  const now = nowIso ?? new Date().toISOString();

  if (result.status === "processing") {
    const updated = await store.update({
      ...intent,
      status: "awaiting_result",
      lastAttemptAt: now,
    });
    return { kind: "awaiting_result", intent: updated, detail: "processing" };
  }

  if (result.status === "failed_final") {
    const updated = await store.update({
      ...intent,
      status: "server_failed_final",
      serverEntryId: result.journalEntryId,
      failureCode:
        result.resultCode === "ACORN_INSUFFICIENT"
          ? "ACORN_INSUFFICIENT"
          : "LOOKUP_FAILED_FINAL",
      lastAttemptAt: now,
      completedAt: now,
    });
    return { kind: "server_failed_final", intent: updated };
  }

  if (result.status === "completed") {
    const bound = await store.update({
      ...intent,
      status: "server_completed",
      serverEntryId: result.journalEntryId,
      failureCode: null,
      lastAttemptAt: now,
    });

    const resolved = await ports.generationResolver.resolveHealthyTechnicalActive();
    if (!resolved.ok) {
      return {
        kind: "server_completed",
        intent: bound,
        serverEntryId: result.journalEntryId,
        mirrorEnqueueCandidate: null,
      };
    }

    const candidate = buildMirrorCandidate(
      bound,
      result.journalEntryId,
      resolved.target,
    );
    return {
      kind: "server_completed",
      intent: bound,
      serverEntryId: result.journalEntryId,
      mirrorEnqueueCandidate: candidate,
    };
  }

  // not_found
  const canRetry = await ports.draftResolver.canResolvePayload(intent.draftRef);
  if (canRetry) {
    const updated = await store.update({
      ...intent,
      status: "awaiting_result",
      lastAttemptAt: now,
    });
    return {
      kind: "awaiting_result",
      intent: updated,
      detail: "not_found_retryable",
    };
  }

  const updated = await store.update({
    ...intent,
    status: "recovery_required",
    failureCode: "PAYLOAD_UNAVAILABLE",
    lastAttemptAt: now,
  });
  return {
    kind: "recovery_required",
    intent: updated,
    detail: "not_found_and_no_durable_payload",
  };
}

/**
 * After mirror outbox enqueue succeeds (or unique hit), mark intent completed.
 * Does not write to outbox itself — caller passes enqueue result.
 */
export async function markIntentMirrorEnqueued(
  store: LocalSaveOperationIntentStore,
  input: {
    actorKey: string;
    saveOperationId: string;
    serverEntryId: string;
    now?: string;
  },
): Promise<LocalSaveOperationIntentRecord> {
  const intent = await store.findByActorAndSaveOperationId(
    input.actorKey.trim().toLowerCase(),
    input.saveOperationId.trim(),
  );
  if (!intent) throw new Error("intent_missing");
  if (intent.status === "completed") return intent;
  const now = input.now ?? new Date().toISOString();
  return store.update({
    ...intent,
    status: "completed",
    serverEntryId: input.serverEntryId,
    completedAt: now,
    lastAttemptAt: now,
    failureCode: null,
  });
}

/** Default draft resolver: no attempt-scoped durable payload in current LJD. */
export function createUnavailableDraftPayloadResolver(): DraftPayloadResolver {
  return {
    async canResolvePayload() {
      return false;
    },
  };
}
