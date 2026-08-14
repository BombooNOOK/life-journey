import { initializeSaveIntentStore } from "@/lib/journal/clientSaveIntent/NativeSaveIntentBootstrap";
import { prepareClientSaveOperationIntent } from "@/lib/journal/clientSaveIntent/ClientSaveOperationIntentService";
import { normalizeClientActorKey } from "@/lib/journal/clientSaveIntent/saveOperationId";
import type {
  ClientSaveIntentStoreBootstrapResult,
  ClientSaveOperationIntent,
  ClientSaveOperationIntentStore,
} from "@/lib/journal/clientSaveIntent/types";

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
  const bootstrap = await deps.bootstrap();
  const capability = await deps.capability();
  if (bootstrap.status !== "ready" || capability.kind !== "enabled") {
    return { kind: "legacy", response: await deps.post(input.payload) };
  }
  const actorKey = normalizeClientActorKey(input.viewerEmail);
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
    intent = await update(bootstrap.store, intent, {
      status: "awaiting_result",
      lastAttemptAt: new Date().toISOString(),
    });
    const response = await deps.post({ ...input.payload, includeInBook: input.payload.includeInBook ?? true, saveOperationId: intent.saveOperationId });
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
    resolvePayload: (intent: ClientSaveOperationIntent) => Promise<JournalCreatePayload | null>;
    afterServerCompleted?: (entryId: string) => Promise<void>;
  },
  deps: JournalCreateSaveOrchestratorDeps = productionDeps,
): Promise<JournalCreateSaveResult[]> {
  const bootstrap = await deps.bootstrap();
  const actorKey = normalizeClientActorKey(input.viewerEmail);
  if (bootstrap.status !== "ready" || !actorKey) return [];
  const capability = await deps.capability();
  const recovered: JournalCreateSaveResult[] = [];
  for (let intent of await bootstrap.store.listRecoverableByActor(actorKey)) {
    if (intent.actorKey !== actorKey) {
      recovered.push({ kind: "recovery_required", intent, reason: "actor_mismatch" });
      continue;
    }
    let response: Response;
    try {
      response = await deps.lookup({ saveOperationId: intent.saveOperationId, requestFingerprint: intent.requestFingerprint });
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
    const payload = await input.resolvePayload(intent);
    if (!payload || capability.kind !== "enabled" || (await fingerprint(payload)) !== intent.requestFingerprint) {
      intent = await update(bootstrap.store, intent, { status: "recovery_required", failureCode: "PAYLOAD_UNAVAILABLE" });
      recovered.push({ kind: "recovery_required", intent, reason: "payload_unavailable_or_rollout_off" });
      continue;
    }
    try {
      const replay = await deps.post({ ...payload, includeInBook: payload.includeInBook ?? true, saveOperationId: intent.saveOperationId });
      const replayData = await responseJson(replay);
      const entryId = typeof replayData.entry === "object" && replayData.entry && typeof (replayData.entry as { id?: unknown }).id === "string"
        ? (replayData.entry as { id: string }).id
        : null;
      if (replay.status === 200 && entryId) {
        intent = await update(bootstrap.store, intent, { status: "server_completed", serverEntryId: entryId });
        await input.afterServerCompleted?.(entryId);
        intent = await update(bootstrap.store, intent, { status: "completed", completedAt: new Date().toISOString() });
        recovered.push({ kind: "completed", entryId, data: replayData, intent });
      } else if (replay.status === 409) {
        intent = await update(bootstrap.store, intent, { status: "recovery_required", failureCode: "IDEMPOTENCY_CONFLICT" });
        recovered.push({ kind: "recovery_required", intent, reason: "fingerprint_mismatch" });
      } else if (replay.status === 402) {
        intent = await update(bootstrap.store, intent, { status: "failed_final", failureCode: "ACORN_INSUFFICIENT", completedAt: new Date().toISOString() });
        recovered.push({ kind: "failed_final", intent, code: "ACORN_INSUFFICIENT" });
      } else {
        recovered.push({ kind: "processing", intent });
      }
    } catch {
      recovered.push({ kind: "processing", intent });
    }
  }
  return recovered;
}
