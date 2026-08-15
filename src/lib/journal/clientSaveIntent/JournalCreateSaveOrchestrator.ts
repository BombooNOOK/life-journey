import { initializeSaveIntentStore } from "@/lib/journal/clientSaveIntent/NativeSaveIntentBootstrap";
import { prepareClientSaveOperationIntent } from "@/lib/journal/clientSaveIntent/ClientSaveOperationIntentService";
import { normalizeClientActorKey } from "@/lib/journal/clientSaveIntent/saveOperationId";
import {
  isSaveIntentActivityBlockedForActor,
  resumeAccountDeleteSaveIntentCleanup,
} from "@/lib/account/accountDeleteSaveIntentTeardown";
import type {
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

export type JournalCreateSaveResult =
  | { kind: "legacy"; response: Response }
  | { kind: "completed"; entryId: string; data: Record<string, unknown>; intent?: ClientSaveOperationIntent }
  | { kind: "processing"; intent: ClientSaveOperationIntent }
  | { kind: "continuation_available"; intent: ClientSaveOperationIntent }
  | { kind: "recovery_required"; intent: ClientSaveOperationIntent; reason: string }
  | { kind: "failed_final"; intent: ClientSaveOperationIntent; code: "ACORN_INSUFFICIENT" | "SERVER_FAILED_FINAL" }
  | { kind: "protocol_start_failed"; reason: string };

export type JournalCreateSaveOrchestratorDeps = {
  bootstrap: () => Promise<ClientSaveIntentStoreBootstrapResult>;
  capability: () => Promise<Capability>;
  post: (payload: JournalCreatePayload) => Promise<Response>;
  lookup: (input: { saveOperationId: string; requestFingerprint: string }) => Promise<Response>;
};

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function fingerprint(payload: JournalCreatePayload): Promise<string> {
  const photoIdentity = payload.photoDataUrl
    ? `photo:${await sha256(payload.photoDataUrl)}`
    : payload.photoRemoved
      ? "remove"
      : "none";
  return [
    "v1",
    await sha256(payload.content.trim()),
    payload.entryDate.trim(),
    photoIdentity,
    `profile:${payload.profileId.trim()}`,
    `mood:${payload.mood}`,
    `activity:${payload.activity}`,
    `companion:${payload.companionType}`,
    `theme:${payload.designTheme}`,
    `font:${payload.contentFontMode}`,
    `book:${payload.includeInBook === false ? "0" : "1"}`,
  ].join("|");
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

// Deliberately process-memory only. It is never written to the Intent DB and
// disappears on restart, which makes restart not_found recovery fail closed.
const currentSessionPayloads = new Map<string, JournalCreatePayload>();
const continuationFlights = new Map<string, Promise<JournalCreateSaveResult>>();

function sessionPayloadKey(actorKey: string, saveOperationId: string): string {
  return `${actorKey}:${saveOperationId}`;
}

/** Test-only volatile-session reset; durable intent rows are intentionally untouched. */
export function clearCurrentSessionJournalCreatePayloadsForTest(): void {
  currentSessionPayloads.clear();
  continuationFlights.clear();
}

async function update(
  store: ClientSaveOperationIntentStore,
  intent: ClientSaveOperationIntent,
  patch: Partial<ClientSaveOperationIntent>,
): Promise<ClientSaveOperationIntent> {
  return store.update({ ...intent, ...patch, updatedAt: new Date().toISOString() });
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
  if (bootstrap.status !== "ready" || capability.kind !== "enabled") {
    return { kind: "legacy", response: await effectiveDeps.post(input.payload) };
  }
  if (!actorKey) return { kind: "protocol_start_failed", reason: "actor_unavailable" };
  const requestFingerprint = await fingerprint(input.payload);
  let prepared;
  try {
    prepared = await prepareClientSaveOperationIntent(bootstrap.store, {
      viewerEmail: input.viewerEmail,
      requestFingerprint,
      draftRef: input.draftRef,
    });
  } catch {
    return { kind: "protocol_start_failed", reason: "intent_prepare_failed" };
  }
  if (prepared.kind === "conflict") {
    return { kind: "recovery_required", intent: prepared.intent, reason: "intent_conflict" };
  }
  let intent = prepared.intent;
  try {
    currentSessionPayloads.set(
      sessionPayloadKey(actorKey, intent.saveOperationId),
      { ...input.payload, includeInBook: input.payload.includeInBook ?? true },
    );
    intent = await update(bootstrap.store, intent, {
      status: "awaiting_result",
      lastAttemptAt: new Date().toISOString(),
    });
    const response = await effectiveDeps.post({
      ...input.payload,
      includeInBook: input.payload.includeInBook ?? true,
      saveOperationId: intent.saveOperationId,
    });
    const data = await responseJson(response);
    if (response.status === 200 && typeof data.entry === "object" && data.entry && typeof (data.entry as { id?: unknown }).id === "string") {
      intent = await update(bootstrap.store, intent, { status: "server_completed", serverEntryId: (data.entry as { id: string }).id });
      try {
        await input.afterServerCompleted?.(intent.serverEntryId!);
      } catch {
        return { kind: "recovery_required", intent, reason: "local_post_save_failed" };
      }
      intent = await update(bootstrap.store, intent, { status: "completed", completedAt: new Date().toISOString() });
      return { kind: "completed", entryId: intent.serverEntryId!, data, intent };
    }
    if (response.status === 202) return { kind: "processing", intent };
    if (response.status === 409) return { kind: "recovery_required", intent: await update(bootstrap.store, intent, { status: "recovery_required", failureCode: "IDEMPOTENCY_CONFLICT" }), reason: "fingerprint_mismatch" };
    if (response.status === 402 || (response.status === 500 && (data.saveOperation as { status?: unknown } | undefined)?.status === "failed_final")) {
      return { kind: "failed_final", intent: await update(bootstrap.store, intent, { status: "failed_final", failureCode: response.status === 402 ? "ACORN_INSUFFICIENT" : "SERVER_FAILED_FINAL", completedAt: new Date().toISOString() }), code: response.status === 402 ? "ACORN_INSUFFICIENT" : "SERVER_FAILED_FINAL" };
    }
    return { kind: "recovery_required", intent, reason: "ambiguous_response" };
  } catch {
    return { kind: "processing", intent };
  }
}

/**
 * Foreground-only reconciliation.  It performs a lookup for durable pending
 * intents and never invents a new operation id or falls back to legacy POST.
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
  const capability = await effectiveDeps.capability();
  const recovered: JournalCreateSaveResult[] = [];
  for (let intent of await bootstrap.store.listRecoverableByActor(actorKey)) {
    if (intent.actorKey !== actorKey) {
      recovered.push({ kind: "recovery_required", intent, reason: "actor_mismatch" });
      continue;
    }
    // A server result was already received.  Recovery must finish local work
    // only; contacting the server again is both unnecessary and unsafe.
    if (intent.status === "server_completed" && intent.serverEntryId) {
      const entryId = intent.serverEntryId;
      try {
        await input.afterServerCompleted?.(entryId);
        intent = await update(bootstrap.store, intent, {
          status: "completed",
          completedAt: new Date().toISOString(),
        });
        recovered.push({ kind: "completed", entryId, data: {}, intent });
      } catch {
        recovered.push({ kind: "recovery_required", intent, reason: "local_post_save_failed" });
      }
      continue;
    }
    // A pending operation never falls back to legacy.  Capability failure
    // therefore leaves it intact without issuing a lookup or POST.
    if (capability.kind === "unavailable") {
      recovered.push({ kind: "recovery_required", intent, reason: "capability_unavailable" });
      continue;
    }
    let response: Response;
    try {
      response = await effectiveDeps.lookup({
        saveOperationId: intent.saveOperationId,
        requestFingerprint: intent.requestFingerprint,
      });
    } catch {
      recovered.push({ kind: "recovery_required", intent, reason: "lookup_unavailable" });
      continue;
    }
    const lookup = await responseJson(response);
    switch (lookup.state) {
      case "completed": {
        const entryId = typeof lookup.entryId === "string" ? lookup.entryId : "";
        if (!entryId) {
          recovered.push({ kind: "recovery_required", intent, reason: "invalid_lookup_completed" });
          continue;
        }
        intent = await update(bootstrap.store, intent, { status: "server_completed", serverEntryId: entryId });
        try {
          await input.afterServerCompleted?.(entryId);
          intent = await update(bootstrap.store, intent, { status: "completed", completedAt: new Date().toISOString() });
          recovered.push({ kind: "completed", entryId, data: {}, intent });
        } catch {
          recovered.push({ kind: "recovery_required", intent, reason: "local_post_save_failed" });
        }
        continue;
      }
      case "processing":
        recovered.push({ kind: "processing", intent });
        continue;
      case "failed_final":
        intent = await update(bootstrap.store, intent, { status: "failed_final", failureCode: "SERVER_FAILED_FINAL", completedAt: new Date().toISOString() });
        recovered.push({ kind: "failed_final", intent, code: "SERVER_FAILED_FINAL" });
        continue;
      case "fingerprint_mismatch":
        intent = await update(bootstrap.store, intent, { status: "recovery_required", failureCode: "IDEMPOTENCY_CONFLICT" });
        recovered.push({ kind: "recovery_required", intent, reason: "fingerprint_mismatch" });
        continue;
      case "not_found":
        break;
      default:
        recovered.push({ kind: "recovery_required", intent, reason: "invalid_lookup_response" });
        continue;
    }
    const currentPayload = currentSessionPayloads.get(
      sessionPayloadKey(actorKey, intent.saveOperationId),
    );
    if (
      capability.kind === "enabled" &&
      currentPayload &&
      (await fingerprint(currentPayload)) === intent.requestFingerprint
    ) {
      recovered.push({ kind: "continuation_available", intent });
      continue;
    }
    // Foreground mount is lookup-only. The intent schema deliberately contains
    // no body or image data, so restarted sessions cannot prove an exact replay.
    intent = await update(bootstrap.store, intent, {
      status: "recovery_required",
      failureCode: "PAYLOAD_UNAVAILABLE",
    });
    recovered.push({ kind: "recovery_required", intent, reason: "payload_unavailable_or_rollout_off" });
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
  const flight = continueCurrentSessionJournalCreateSaveRecoveryInner(input, deps).finally(() => {
    continuationFlights.delete(key);
  });
  continuationFlights.set(key, flight);
  return flight;
}

async function continueCurrentSessionJournalCreateSaveRecoveryInner(
  input: { viewerEmail: string; saveOperationId: string; afterServerCompleted?: (entryId: string) => Promise<void> },
  deps?: JournalCreateSaveOrchestratorDeps,
): Promise<JournalCreateSaveResult> {
  const actorKey = normalizeClientActorKey(input.viewerEmail);
  const payload = actorKey
    ? currentSessionPayloads.get(sessionPayloadKey(actorKey, input.saveOperationId))
    : undefined;
  if (!payload) return { kind: "protocol_start_failed", reason: "current_payload_unavailable" };
  return continueJournalCreateSaveRecovery({ ...input, payload }, deps);
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
 * Explicit user-action path for a not-found intent. Callers must supply a
 * freshly reconstructed canonical payload; mount recovery never calls this.
 */
export async function continueJournalCreateSaveRecovery(
  input: {
    viewerEmail: string;
    saveOperationId: string;
    payload: JournalCreatePayload;
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
  const capability = await effectiveDeps.capability();
  if (bootstrap.status !== "ready" || !actorKey || capability.kind !== "enabled") {
    return { kind: "protocol_start_failed", reason: "recovery_not_admitted" };
  }
  const intent = await bootstrap.store.findByActorAndSaveOperationId(actorKey, input.saveOperationId);
  if (!intent || intent.actorKey !== actorKey || (await fingerprint(input.payload)) !== intent.requestFingerprint) {
    return intent
      ? { kind: "recovery_required", intent, reason: "payload_fingerprint_mismatch" }
      : { kind: "protocol_start_failed", reason: "intent_not_found" };
  }
  const awaiting = await update(bootstrap.store, intent, {
    status: "awaiting_result",
    lastAttemptAt: new Date().toISOString(),
  });
  try {
    const response = await effectiveDeps.post({
      ...input.payload,
      includeInBook: input.payload.includeInBook ?? true,
      saveOperationId: awaiting.saveOperationId,
    });
    const data = await responseJson(response);
    const entryId =
      typeof data.entry === "object" &&
      data.entry &&
      typeof (data.entry as { id?: unknown }).id === "string"
        ? (data.entry as { id: string }).id
        : null;
    if (response.status === 200 && entryId) {
      let completedIntent = await update(bootstrap.store, awaiting, {
        status: "server_completed",
        serverEntryId: entryId,
      });
      await input.afterServerCompleted?.(entryId);
      completedIntent = await update(bootstrap.store, completedIntent, {
        status: "completed",
        completedAt: new Date().toISOString(),
      });
      return { kind: "completed", entryId, data, intent: completedIntent };
    }
    if (response.status === 202) return { kind: "processing", intent: awaiting };
    if (response.status === 409) {
      return {
        kind: "recovery_required",
        intent: await update(bootstrap.store, awaiting, { status: "recovery_required", failureCode: "IDEMPOTENCY_CONFLICT" }),
        reason: "fingerprint_mismatch",
      };
    }
    if (response.status === 402) {
      return {
        kind: "failed_final",
        intent: await update(bootstrap.store, awaiting, { status: "failed_final", failureCode: "ACORN_INSUFFICIENT", completedAt: new Date().toISOString() }),
        code: "ACORN_INSUFFICIENT",
      };
    }
    return { kind: "processing", intent: awaiting };
  } catch {
    return { kind: "processing", intent: awaiting };
  }
}
