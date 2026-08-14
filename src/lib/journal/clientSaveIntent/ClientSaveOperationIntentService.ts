import {
  createClientSaveOperationId,
  isValidClientSaveOperationId,
  normalizeClientActorKey,
} from "@/lib/journal/clientSaveIntent/saveOperationId";
import type {
  ClientSaveIdempotencyCapabilityProvider,
  ClientSaveOperationIntent,
  ClientSaveOperationIntentStore,
  ClientSaveOperationResult,
  ClientSaveOperationTransport,
} from "@/lib/journal/clientSaveIntent/types";

function nowIso(): string {
  return new Date().toISOString();
}

function newIntentId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return `intent_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export type PrepareClientSaveOperationInput = {
  viewerEmail: string;
  requestFingerprint: string;
  draftRef?: string | null;
  saveOperationId?: string;
  now?: string;
};

export type PrepareClientSaveOperationResult =
  | { kind: "created"; intent: ClientSaveOperationIntent }
  | { kind: "existing"; intent: ClientSaveOperationIntent }
  | { kind: "conflict"; intent: ClientSaveOperationIntent };

/**
 * Mandatory first step for an idempotent client save.
 *
 * Call and await this before POST. No payload is accepted or written here.
 */
export async function prepareClientSaveOperationIntent(
  store: ClientSaveOperationIntentStore,
  input: PrepareClientSaveOperationInput,
): Promise<PrepareClientSaveOperationResult> {
  const actorKey = normalizeClientActorKey(input.viewerEmail);
  const requestFingerprint = input.requestFingerprint.trim();
  const saveOperationId = (
    input.saveOperationId ?? createClientSaveOperationId()
  ).trim();
  if (!actorKey) throw new Error("viewer_email_required");
  if (!requestFingerprint) throw new Error("request_fingerprint_required");
  if (!isValidClientSaveOperationId(saveOperationId)) {
    throw new Error("save_operation_id_invalid");
  }

  const now = input.now ?? nowIso();
  const candidate: ClientSaveOperationIntent = {
    intentId: newIntentId(),
    saveOperationId,
    actorKey,
    draftRef: input.draftRef ?? null,
    requestFingerprint,
    status: "prepared",
    serverEntryId: null,
    failureCode: null,
    createdAt: now,
    updatedAt: now,
    lastAttemptAt: null,
    completedAt: null,
  };
  const insert = await store.tryInsert(candidate);
  if (insert.created) return { kind: "created", intent: insert.intent };
  if (
    insert.intent.actorKey !== actorKey ||
    insert.intent.requestFingerprint !== requestFingerprint
  ) {
    return { kind: "conflict", intent: insert.intent };
  }
  return { kind: "existing", intent: insert.intent };
}

async function updateForResult(
  store: ClientSaveOperationIntentStore,
  intent: ClientSaveOperationIntent,
  result: ClientSaveOperationResult,
  now: string,
): Promise<ClientSaveOperationIntent> {
  switch (result.kind) {
    case "completed":
      return store.update({
        ...intent,
        status: "completed",
        serverEntryId: result.serverEntryId,
        failureCode: null,
        updatedAt: now,
        lastAttemptAt: now,
        completedAt: now,
      });
    case "processing":
      return store.update({
        ...intent,
        status: "awaiting_result",
        updatedAt: now,
        lastAttemptAt: now,
      });
    case "fingerprint_mismatch":
      return store.update({
        ...intent,
        status: "recovery_required",
        failureCode: "IDEMPOTENCY_CONFLICT",
        updatedAt: now,
        lastAttemptAt: now,
      });
    case "failed_final":
      return store.update({
        ...intent,
        status: "failed_final",
        failureCode:
          result.code === "ACORN_INSUFFICIENT"
            ? "ACORN_INSUFFICIENT"
            : "SERVER_FAILED_FINAL",
        updatedAt: now,
        lastAttemptAt: now,
        completedAt: now,
      });
    case "transport_failure":
      return store.update({
        ...intent,
        status: "awaiting_result",
        updatedAt: now,
        lastAttemptAt: now,
      });
  }
}

/**
 * Executes only for an account the server explicitly marks capable and eligible.
 * With capability OFF this returns legacy, creates no intent, and sends no ID.
 */
export async function runNewClientSaveOperation(
  deps: {
    capabilities: ClientSaveIdempotencyCapabilityProvider;
    store: ClientSaveOperationIntentStore;
    transport: ClientSaveOperationTransport;
  },
  input: PrepareClientSaveOperationInput,
): Promise<
  | { kind: "legacy" }
  | { kind: "conflict"; intent: ClientSaveOperationIntent }
  | { kind: "result"; result: ClientSaveOperationResult; intent: ClientSaveOperationIntent }
> {
  const capability = await deps.capabilities.getCapability();
  if (!capability.enabled) return { kind: "legacy" };

  const prepared = await prepareClientSaveOperationIntent(deps.store, input);
  if (prepared.kind === "conflict") return prepared;
  const intent = prepared.intent;
  if (intent.status === "completed" || intent.status === "failed_final") {
    return {
      kind: "result",
      intent,
      result:
        intent.status === "completed" && intent.serverEntryId
          ? { kind: "completed", serverEntryId: intent.serverEntryId }
          : { kind: "failed_final", code: "SERVER_FAILED_FINAL" },
    };
  }
  if (intent.status === "recovery_required") {
    return { kind: "conflict", intent };
  }

  const result = await deps.transport.post({ saveOperationId: intent.saveOperationId });
  return {
    kind: "result",
    result,
    intent: await updateForResult(deps.store, intent, result, input.now ?? nowIso()),
  };
}

/**
 * Foreground-only recovery. It never reposts: a same-operation retry requires
 * a future authenticated lookup endpoint plus an explicit user action.
 */
export async function recoverClientSaveOperation(
  deps: {
    capabilities: ClientSaveIdempotencyCapabilityProvider;
    store: ClientSaveOperationIntentStore;
    transport: ClientSaveOperationTransport;
  },
  input: { viewerEmail: string; saveOperationId: string; now?: string },
): Promise<
  | { kind: "capability_unavailable"; intent: ClientSaveOperationIntent }
  | { kind: "lookup_unavailable"; intent: ClientSaveOperationIntent }
  | { kind: "result"; result: ClientSaveOperationResult; intent: ClientSaveOperationIntent }
> {
  const actorKey = normalizeClientActorKey(input.viewerEmail);
  const intent = await deps.store.findByActorAndSaveOperationId(
    actorKey,
    input.saveOperationId,
  );
  if (!intent) throw new Error("intent_missing");
  const capability = await deps.capabilities.getCapability();
  if (!capability.enabled) {
    return { kind: "capability_unavailable", intent };
  }
  if (!deps.transport.lookup) return { kind: "lookup_unavailable", intent };
  const result = await deps.transport.lookup({ saveOperationId: intent.saveOperationId });
  return {
    kind: "result",
    result,
    intent: await updateForResult(deps.store, intent, result, input.now ?? nowIso()),
  };
}
