import { initializeSaveIntentStore } from "@/lib/journal/clientSaveIntent/NativeSaveIntentBootstrap";
import { canonicalizeExactJournalSavePayload } from "@/lib/journal/clientSaveIntent/exactPayloadCanonical";
import {
  createClientSaveOperationId,
  normalizeClientActorKey,
} from "@/lib/journal/clientSaveIntent/saveOperationId";
import {
  isSaveIntentActivityBlockedForActor,
  resumeAccountDeleteSaveIntentCleanup,
} from "@/lib/account/accountDeleteSaveIntentTeardown";
import type {
  ClientSaveDurableStore,
  ClientSaveIntentStoreBootstrapResult,
  ClientSaveOperationIntent,
  ClientSaveOperationIntentStore,
} from "@/lib/journal/clientSaveIntent/types";
import { wrapJournalCreateDepsWithLocalE2eFaults } from "@/lib/localE2eHarness/transportAdapters";

export type JournalCreatePayload = {
  content: string;
  mood: string;
  activity: string;
  companionType: string;
  designTheme: string;
  contentFontMode: string;
  entryDate: string;
  profileId: string;
  effectiveProfileId?: string;
  includeInBook?: boolean;
  photoDataUrl?: string;
  photoRemoved?: boolean;
  [key: string]: unknown;
};

type Capability =
  | { kind: "enabled" }
  | { kind: "disabled" | "unavailable" | "unknown_protocol" };

/** Compact recovery presentation for callers. User-facing copy stays minimal. */
export type JournalCreateRecoveryState =
  | "completed"
  | "pending"
  | "processing"
  | "recovery_required"
  | "failed_final";

export type JournalCreateSaveResult =
  | { kind: "legacy"; response: Response }
  | {
      kind: "completed";
      recoveryState: "completed";
      entryId: string;
      data: Record<string, unknown>;
      intent?: ClientSaveOperationIntent;
    }
  | {
      kind: "pending";
      recoveryState: "pending";
      intent: ClientSaveOperationIntent;
    }
  | {
      kind: "processing";
      recoveryState: "processing";
      intent: ClientSaveOperationIntent;
    }
  | { kind: "continuation_available"; intent: ClientSaveOperationIntent }
  | {
      kind: "recovery_required";
      recoveryState: "recovery_required";
      intent: ClientSaveOperationIntent;
      reason: string;
    }
  | {
      kind: "failed_final";
      recoveryState: "failed_final";
      intent: ClientSaveOperationIntent;
      code: "ACORN_INSUFFICIENT" | "SERVER_FAILED_FINAL";
    }
  | { kind: "protocol_start_failed"; reason: string };

export type JournalCreateSaveOrchestratorDeps = {
  bootstrap: () => Promise<ClientSaveIntentStoreBootstrapResult>;
  capability: () => Promise<Capability>;
  /** Legacy POST only — never used after durable intent+payload persist. */
  post: (payload: JournalCreatePayload) => Promise<Response>;
  /**
   * Protocol POST of the stored canonical JSON string. Tests may omit this and
   * the orchestrator will parse the stored JSON once (not rebuild from fields).
   */
  postExactJson?: (requestJson: string) => Promise<Response>;
  lookup: (input: { saveOperationId: string; requestFingerprint: string }) => Promise<Response>;
};

function isDurableStore(
  store: ClientSaveOperationIntentStore,
): store is ClientSaveDurableStore {
  return (
    typeof (store as ClientSaveDurableStore).persistPreparedIntentWithExactPayload ===
      "function" &&
    typeof (store as ClientSaveDurableStore).loadExactPayloadBySaveOperationId === "function"
  );
}

function newIntentId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return `intent_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function explicitProfileId(payload: JournalCreatePayload): string {
  const profileId =
    typeof payload.profileId === "string" ? payload.profileId.trim() : "";
  if (profileId) return profileId;
  return typeof payload.effectiveProfileId === "string"
    ? payload.effectiveProfileId.trim()
    : "";
}

async function responseJson(response: Response): Promise<Record<string, unknown>> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function serverCapability(): Promise<Capability> {
  try {
    const response = await fetch("/api/journal/save-capability", { credentials: "same-origin" });
    if (!response.ok) return { kind: "unavailable" };
    const data = (await response.json()) as Record<string, unknown>;
    if (data.protocolVersion !== 1) return { kind: "unknown_protocol" };
    return data.idempotentSaveEnabled === true ? { kind: "enabled" } : { kind: "disabled" };
  } catch {
    return { kind: "unavailable" };
  }
}

const productionDeps: JournalCreateSaveOrchestratorDeps = {
  bootstrap: initializeSaveIntentStore,
  capability: serverCapability,
  post: (payload) =>
    fetch("/api/journal", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  postExactJson: (requestJson) =>
    fetch("/api/journal", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: requestJson,
    }),
  lookup: ({ saveOperationId, requestFingerprint }) =>
    fetch(
      `/api/journal/save-operations/${encodeURIComponent(saveOperationId)}?requestFingerprint=${encodeURIComponent(requestFingerprint)}`,
      { credentials: "same-origin" },
    ),
};

/** Default path only: wrap is a no-op unless a one-shot fault is armed. */
function resolveDeps(
  viewerEmail: string,
  deps: JournalCreateSaveOrchestratorDeps,
): JournalCreateSaveOrchestratorDeps {
  if (deps !== productionDeps) return deps;
  return wrapJournalCreateDepsWithLocalE2eFaults(productionDeps, () => viewerEmail);
}

const continuationFlights = new Map<string, Promise<JournalCreateSaveResult>>();

function sessionPayloadKey(actorKey: string, saveOperationId: string): string {
  return `${actorKey}:${saveOperationId}`;
}

/** Test-only flight reset; durable intent+payload rows are intentionally untouched. */
export function clearCurrentSessionJournalCreatePayloadsForTest(): void {
  continuationFlights.clear();
}

async function update(
  store: ClientSaveOperationIntentStore,
  intent: ClientSaveOperationIntent,
  patch: Partial<ClientSaveOperationIntent>,
): Promise<ClientSaveOperationIntent> {
  return store.update({ ...intent, ...patch, updatedAt: new Date().toISOString() });
}

async function postStoredRequestJson(
  deps: JournalCreateSaveOrchestratorDeps,
  requestJson: string,
): Promise<Response> {
  if (deps.postExactJson) {
    return deps.postExactJson(requestJson);
  }
  return deps.post(JSON.parse(requestJson) as JournalCreatePayload);
}

function saveOperationIdFromRequestJson(requestJson: string): string | null {
  try {
    const parsed = JSON.parse(requestJson) as { saveOperationId?: unknown };
    return typeof parsed.saveOperationId === "string" ? parsed.saveOperationId : null;
  } catch {
    return null;
  }
}

async function applyPostedProtocolResponse(input: {
  store: ClientSaveOperationIntentStore;
  intent: ClientSaveOperationIntent;
  response: Response;
  afterServerCompleted?: (entryId: string) => Promise<void>;
}): Promise<JournalCreateSaveResult> {
  const data = await responseJson(input.response);
  const entryId =
    typeof data.entry === "object" &&
    data.entry &&
    typeof (data.entry as { id?: unknown }).id === "string"
      ? (data.entry as { id: string }).id
      : null;
  if (input.response.status === 200 && entryId) {
    let intent = await update(input.store, input.intent, {
      status: "server_completed",
      serverEntryId: entryId,
    });
    try {
      await input.afterServerCompleted?.(entryId);
    } catch {
      return {
        kind: "recovery_required",
        recoveryState: "recovery_required",
        intent,
        reason: "local_post_save_failed",
      };
    }
    intent = await update(input.store, intent, {
      status: "completed",
      completedAt: new Date().toISOString(),
    });
    return { kind: "completed", recoveryState: "completed", entryId, data, intent };
  }
  if (input.response.status === 202) {
    return { kind: "processing", recoveryState: "processing", intent: input.intent };
  }
  if (input.response.status === 409) {
    return {
      kind: "recovery_required",
      recoveryState: "recovery_required",
      intent: await update(input.store, input.intent, {
        status: "recovery_required",
        failureCode: "IDEMPOTENCY_CONFLICT",
      }),
      reason: "fingerprint_mismatch",
    };
  }
  if (
    input.response.status === 402 ||
    (input.response.status === 500 &&
      (data.saveOperation as { status?: unknown } | undefined)?.status === "failed_final")
  ) {
    const code = input.response.status === 402 ? "ACORN_INSUFFICIENT" : "SERVER_FAILED_FINAL";
    return {
      kind: "failed_final",
      recoveryState: "failed_final",
      intent: await update(input.store, input.intent, {
        status: "failed_final",
        failureCode: code,
        completedAt: new Date().toISOString(),
      }),
      code,
    };
  }
  return {
    kind: "recovery_required",
    recoveryState: "recovery_required",
    intent: input.intent,
    reason: "ambiguous_response",
  };
}

function failClosedPayload(intent: ClientSaveOperationIntent, reason: string): JournalCreateSaveResult {
  return {
    kind: "recovery_required",
    recoveryState: "recovery_required",
    intent,
    reason,
  };
}

/**
 * Verify durable exact payload, then POST the stored request_json string once.
 * Never rebuilds a body from fingerprint fragments, active profile, or photos.
 */
async function replayExactStoredPayload(input: {
  store: ClientSaveDurableStore;
  intent: ClientSaveOperationIntent;
  deps: JournalCreateSaveOrchestratorDeps;
  afterServerCompleted?: (entryId: string) => Promise<void>;
}): Promise<JournalCreateSaveResult> {
  const loaded = await input.store.loadExactPayloadBySaveOperationId(input.intent.saveOperationId);
  if (loaded.kind === "missing") {
    const intent = await update(input.store, input.intent, {
      status: "recovery_required",
      failureCode: "PAYLOAD_UNAVAILABLE",
    });
    return failClosedPayload(intent, "PAYLOAD_UNAVAILABLE");
  }
  if (loaded.kind === "corrupt") {
    const intent = await update(input.store, input.intent, {
      status: "recovery_required",
      failureCode: "PAYLOAD_UNAVAILABLE",
    });
    return failClosedPayload(intent, "payload_corrupt");
  }
  if (loaded.kind === "fingerprint_mismatch") {
    const intent = await update(input.store, input.intent, {
      status: "recovery_required",
      failureCode: "IDEMPOTENCY_CONFLICT",
    });
    return failClosedPayload(intent, "fingerprint_mismatch");
  }

  const requestJson = loaded.payload.requestJson;
  const jsonId = saveOperationIdFromRequestJson(requestJson);
  if (jsonId !== input.intent.saveOperationId) {
    const intent = await update(input.store, input.intent, {
      status: "recovery_required",
      failureCode: "PAYLOAD_UNAVAILABLE",
    });
    return failClosedPayload(intent, "save_operation_id_mismatch");
  }

  const recanon = canonicalizeExactJournalSavePayload({
    saveOperationId: input.intent.saveOperationId,
    payload: loaded.request,
  });
  if (!recanon.ok) {
    const intent = await update(input.store, input.intent, {
      status: "recovery_required",
      failureCode: "PAYLOAD_UNAVAILABLE",
    });
    return failClosedPayload(intent, "payload_immutable_mismatch");
  }
  if (recanon.requestFingerprint !== input.intent.requestFingerprint) {
    const intent = await update(input.store, input.intent, {
      status: "recovery_required",
      failureCode: "IDEMPOTENCY_CONFLICT",
    });
    return failClosedPayload(intent, "fingerprint_mismatch");
  }
  if (recanon.requestJson !== requestJson) {
    const intent = await update(input.store, input.intent, {
      status: "recovery_required",
      failureCode: "PAYLOAD_UNAVAILABLE",
    });
    return failClosedPayload(intent, "payload_immutable_mismatch");
  }

  const awaiting = await update(input.store, input.intent, {
    status: "awaiting_result",
    lastAttemptAt: new Date().toISOString(),
  });
  try {
    const response = await postStoredRequestJson(input.deps, requestJson);
    return applyPostedProtocolResponse({
      store: input.store,
      intent: awaiting,
      response,
      afterServerCompleted: input.afterServerCompleted,
    });
  } catch {
    return { kind: "pending", recoveryState: "pending", intent: awaiting };
  }
}

export async function runJournalCreateSave(
  input: {
    viewerEmail: string;
    payload: JournalCreatePayload;
    draftRef?: string | null;
    afterServerCompleted?: (entryId: string) => Promise<void>;
  },
  deps: JournalCreateSaveOrchestratorDeps = productionDeps,
): Promise<JournalCreateSaveResult> {
  const effectiveDeps = resolveDeps(input.viewerEmail, deps);
  const actorKey = normalizeClientActorKey(input.viewerEmail);
  if (actorKey && isSaveIntentActivityBlockedForActor(actorKey)) {
    return { kind: "protocol_start_failed", reason: "account_delete_in_progress" };
  }
  const bootstrap = await effectiveDeps.bootstrap();
  if (bootstrap.status === "ready" && actorKey) {
    if (await resumeAccountDeleteSaveIntentCleanup(actorKey, bootstrap.store)) {
      return { kind: "protocol_start_failed", reason: "account_delete_in_progress" };
    }
  }
  const capability = await effectiveDeps.capability();
  const eligible =
    bootstrap.status === "ready" &&
    isDurableStore(bootstrap.store) &&
    capability.kind === "enabled";
  if (!eligible) {
    return { kind: "legacy", response: await effectiveDeps.post(input.payload) };
  }
  if (!actorKey) return { kind: "protocol_start_failed", reason: "actor_unavailable" };

  const saveOperationId = createClientSaveOperationId();
  const persistPayload = {
    ...input.payload,
    profileId: explicitProfileId(input.payload),
    includeInBook: input.payload.includeInBook ?? true,
    saveOperationId,
  };
  const canonical = canonicalizeExactJournalSavePayload({
    saveOperationId,
    payload: persistPayload,
  });
  if (!canonical.ok) {
    return { kind: "protocol_start_failed", reason: `payload_rejected:${canonical.code}` };
  }

  const now = new Date().toISOString();
  const preparedIntent: ClientSaveOperationIntent = {
    intentId: newIntentId(),
    saveOperationId,
    actorKey,
    draftRef: input.draftRef ?? null,
    requestFingerprint: canonical.requestFingerprint,
    status: "prepared",
    serverEntryId: null,
    failureCode: null,
    createdAt: now,
    updatedAt: now,
    lastAttemptAt: null,
    completedAt: null,
  };

  let persisted;
  try {
    persisted = await bootstrap.store.persistPreparedIntentWithExactPayload({
      intent: preparedIntent,
      payload: persistPayload,
    });
  } catch {
    return { kind: "protocol_start_failed", reason: "intent_prepare_failed" };
  }
  if (persisted.kind !== "created" && persisted.kind !== "already_exists") {
    return { kind: "protocol_start_failed", reason: "intent_prepare_failed" };
  }

  const requestJson = persisted.payload.requestJson;
  let intent = persisted.intent;
  try {
    intent = await update(bootstrap.store, intent, {
      status: "awaiting_result",
      lastAttemptAt: new Date().toISOString(),
    });
    const response = await postStoredRequestJson(effectiveDeps, requestJson);
    return applyPostedProtocolResponse({
      store: bootstrap.store,
      intent,
      response,
      afterServerCompleted: input.afterServerCompleted,
    });
  } catch {
    return { kind: "pending", recoveryState: "pending", intent };
  }
}

/**
 * Foreground-only reconciliation. Lookup first; not_found may exact-replay
 * stored request_json once. Never invents a new operation id or falls back
 * to legacy POST after a durable intent exists.
 */
export async function recoverJournalCreateSaves(
  input: {
    viewerEmail: string;
    afterServerCompleted?: (entryId: string) => Promise<void>;
  },
  deps: JournalCreateSaveOrchestratorDeps = productionDeps,
): Promise<JournalCreateSaveResult[]> {
  const effectiveDeps = resolveDeps(input.viewerEmail, deps);
  const bootstrap = await effectiveDeps.bootstrap();
  const actorKey = normalizeClientActorKey(input.viewerEmail);
  if (bootstrap.status !== "ready" || !actorKey) return [];
  if (isSaveIntentActivityBlockedForActor(actorKey)) return [];
  if (await resumeAccountDeleteSaveIntentCleanup(actorKey, bootstrap.store)) return [];
  const recovered: JournalCreateSaveResult[] = [];
  const replayedThisCycle = new Set<string>();
  for (let intent of await bootstrap.store.listRecoverableByActor(actorKey)) {
    if (intent.actorKey !== actorKey) {
      recovered.push({
        kind: "recovery_required",
        recoveryState: "recovery_required",
        intent,
        reason: "actor_mismatch",
      });
      continue;
    }
    if (intent.status === "server_completed" && intent.serverEntryId) {
      const entryId = intent.serverEntryId;
      try {
        await input.afterServerCompleted?.(entryId);
        intent = await update(bootstrap.store, intent, {
          status: "completed",
          completedAt: new Date().toISOString(),
        });
        recovered.push({
          kind: "completed",
          recoveryState: "completed",
          entryId,
          data: {},
          intent,
        });
      } catch {
        recovered.push({
          kind: "recovery_required",
          recoveryState: "recovery_required",
          intent,
          reason: "local_post_save_failed",
        });
      }
      continue;
    }
    let response: Response;
    try {
      response = await effectiveDeps.lookup({
        saveOperationId: intent.saveOperationId,
        requestFingerprint: intent.requestFingerprint,
      });
    } catch {
      recovered.push({
        kind: "recovery_required",
        recoveryState: "recovery_required",
        intent,
        reason: "lookup_unavailable",
      });
      continue;
    }
    const lookup = await responseJson(response);
    switch (lookup.state) {
      case "completed": {
        const entryId = typeof lookup.entryId === "string" ? lookup.entryId : "";
        if (!entryId) {
          recovered.push({
            kind: "recovery_required",
            recoveryState: "recovery_required",
            intent,
            reason: "invalid_lookup_completed",
          });
          continue;
        }
        intent = await update(bootstrap.store, intent, {
          status: "server_completed",
          serverEntryId: entryId,
        });
        try {
          await input.afterServerCompleted?.(entryId);
          intent = await update(bootstrap.store, intent, {
            status: "completed",
            completedAt: new Date().toISOString(),
          });
          recovered.push({
            kind: "completed",
            recoveryState: "completed",
            entryId,
            data: {},
            intent,
          });
        } catch {
          recovered.push({
            kind: "recovery_required",
            recoveryState: "recovery_required",
            intent,
            reason: "local_post_save_failed",
          });
        }
        continue;
      }
      case "processing":
        recovered.push({ kind: "processing", recoveryState: "processing", intent });
        continue;
      case "failed_final":
        intent = await update(bootstrap.store, intent, {
          status: "failed_final",
          failureCode: "SERVER_FAILED_FINAL",
          completedAt: new Date().toISOString(),
        });
        recovered.push({
          kind: "failed_final",
          recoveryState: "failed_final",
          intent,
          code: "SERVER_FAILED_FINAL",
        });
        continue;
      case "fingerprint_mismatch":
        intent = await update(bootstrap.store, intent, {
          status: "recovery_required",
          failureCode: "IDEMPOTENCY_CONFLICT",
        });
        recovered.push({
          kind: "recovery_required",
          recoveryState: "recovery_required",
          intent,
          reason: "fingerprint_mismatch",
        });
        continue;
      case "not_found":
        break;
      default:
        recovered.push({
          kind: "recovery_required",
          recoveryState: "recovery_required",
          intent,
          reason: "invalid_lookup_response",
        });
        continue;
    }

    if (!isDurableStore(bootstrap.store)) {
      intent = await update(bootstrap.store, intent, {
        status: "recovery_required",
        failureCode: "PAYLOAD_UNAVAILABLE",
      });
      recovered.push(failClosedPayload(intent, "PAYLOAD_UNAVAILABLE"));
      continue;
    }
    if (replayedThisCycle.has(intent.saveOperationId)) {
      recovered.push({ kind: "pending", recoveryState: "pending", intent });
      continue;
    }
    replayedThisCycle.add(intent.saveOperationId);
    recovered.push(
      await replayExactStoredPayload({
        store: bootstrap.store,
        intent,
        deps: effectiveDeps,
        afterServerCompleted: input.afterServerCompleted,
      }),
    );
  }
  return recovered;
}

export async function continueCurrentSessionJournalCreateSaveRecovery(
  input: { viewerEmail: string; saveOperationId: string; afterServerCompleted?: (entryId: string) => Promise<void> },
  deps?: JournalCreateSaveOrchestratorDeps,
): Promise<JournalCreateSaveResult> {
  const actorKey = normalizeClientActorKey(input.viewerEmail);
  if (!actorKey) return { kind: "protocol_start_failed", reason: "current_payload_unavailable" };
  if (isSaveIntentActivityBlockedForActor(actorKey)) {
    return { kind: "protocol_start_failed", reason: "account_delete_in_progress" };
  }
  const key = sessionPayloadKey(actorKey, input.saveOperationId);
  const active = continuationFlights.get(key);
  if (active) return active;
  const flight = continueJournalCreateSaveRecovery(input, deps).finally(() => {
    continuationFlights.delete(key);
  });
  continuationFlights.set(key, flight);
  return flight;
}

const foregroundRecoveryFlights = new Map<string, Promise<JournalCreateSaveResult[]>>();

/** Application-scoped single-flight guard for route mounts and React Strict Mode. */
export function runForegroundJournalCreateRecovery(
  input: Parameters<typeof recoverJournalCreateSaves>[0],
  deps?: JournalCreateSaveOrchestratorDeps,
): Promise<JournalCreateSaveResult[]> {
  const actorKey = normalizeClientActorKey(input.viewerEmail);
  if (!actorKey) return Promise.resolve([]);
  if (isSaveIntentActivityBlockedForActor(actorKey)) return Promise.resolve([]);
  const active = foregroundRecoveryFlights.get(actorKey);
  if (active) return active;
  const flight = recoverJournalCreateSaves(input, deps).finally(() => {
    foregroundRecoveryFlights.delete(actorKey);
  });
  foregroundRecoveryFlights.set(actorKey, flight);
  return flight;
}

/**
 * Explicit foreground path for one pending operation. Lookup first, then at
 * most one exact request_json replay. Caller payload is ignored — recovery
 * never rebuilds from UI/profile/photo sources.
 */
export async function continueJournalCreateSaveRecovery(
  input: {
    viewerEmail: string;
    saveOperationId: string;
    payload?: JournalCreatePayload;
    afterServerCompleted?: (entryId: string) => Promise<void>;
  },
  deps: JournalCreateSaveOrchestratorDeps = productionDeps,
): Promise<JournalCreateSaveResult> {
  const effectiveDeps = resolveDeps(input.viewerEmail, deps);
  const actorKey = normalizeClientActorKey(input.viewerEmail);
  if (actorKey && isSaveIntentActivityBlockedForActor(actorKey)) {
    return { kind: "protocol_start_failed", reason: "account_delete_in_progress" };
  }
  const bootstrap = await effectiveDeps.bootstrap();
  if (bootstrap.status !== "ready" || !actorKey) {
    return { kind: "protocol_start_failed", reason: "recovery_not_admitted" };
  }
  const intent = await bootstrap.store.findByActorAndSaveOperationId(actorKey, input.saveOperationId);
  if (!intent || intent.actorKey !== actorKey) {
    return { kind: "protocol_start_failed", reason: "intent_not_found" };
  }
  if (intent.status === "completed" && intent.serverEntryId) {
    return {
      kind: "completed",
      recoveryState: "completed",
      entryId: intent.serverEntryId,
      data: {},
      intent,
    };
  }
  if (intent.status === "failed_final") {
    return {
      kind: "failed_final",
      recoveryState: "failed_final",
      intent,
      code: intent.failureCode === "ACORN_INSUFFICIENT" ? "ACORN_INSUFFICIENT" : "SERVER_FAILED_FINAL",
    };
  }
  const results = await recoverJournalCreateSaves(
    { viewerEmail: input.viewerEmail, afterServerCompleted: input.afterServerCompleted },
    {
      ...effectiveDeps,
      bootstrap: async () => ({
        status: "ready",
        store: {
          ...bootstrap.store,
          listRecoverableByActor: async () => [intent],
        },
      }),
    },
  );
  return (
    results[0] ?? {
      kind: "recovery_required",
      recoveryState: "recovery_required",
      intent,
      reason: "intent_not_found",
    }
  );
}
