/**
 * Dev-only deps wrapper: observe PENDING_DURABLE → POST_BEGIN ordering and
 * optionally interrupt after durable persist (no network POST).
 *
 * Does not change orchestrator ordering — only wraps store.persist and post*.
 */

import type {
  JournalCreatePayload,
  JournalCreateSaveOrchestratorDeps,
} from "@/lib/journal/clientSaveIntent/JournalCreateSaveOrchestrator";
import { initializeSaveIntentStore } from "@/lib/journal/clientSaveIntent/NativeSaveIntentBootstrap";
import type {
  ClientSaveDurableStore,
  ClientSaveIntentStoreBootstrapResult,
  ClientSaveOperationIntentStore,
} from "@/lib/journal/clientSaveIntent/types";
import {
  aliasSaveOperationId,
  classifyStableActorKey,
  type X66bEvidencePhase,
} from "@/lib/journal/clientSaveIntent/x66bDeviceValidation/evidence";

export const X66B_CONTROLLED_INTERRUPT_ERROR = "x66b_dev_interrupt_after_persist" as const;

export type X66bInstrumentEvent = Omit<X66bEvidencePhase, "at"> & { at?: string };

function isDurableStore(
  store: ClientSaveOperationIntentStore,
): store is ClientSaveDurableStore {
  return (
    typeof (store as ClientSaveDurableStore).persistPreparedIntentWithExactPayload ===
    "function"
  );
}

async function defaultCapability(): Promise<
  | { kind: "enabled" }
  | { kind: "disabled" | "unavailable" | "unknown_protocol" }
> {
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

const baseProductionDeps: JournalCreateSaveOrchestratorDeps = {
  bootstrap: initializeSaveIntentStore,
  capability: defaultCapability,
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

export function createX66bInstrumentedDeps(input: {
  interruptAfterPersist: boolean;
  onEvent: (event: X66bInstrumentEvent) => void;
  /** Injected deps for unit tests; defaults to production path. */
  base?: JournalCreateSaveOrchestratorDeps;
}): JournalCreateSaveOrchestratorDeps {
  const base = input.base ?? baseProductionDeps;
  let durableAtMs: number | null = null;
  let postBeginAtMs: number | null = null;

  const wrapBootstrap = async (): Promise<ClientSaveIntentStoreBootstrapResult> => {
    const bootstrap = await base.bootstrap();
    if (bootstrap.status !== "ready" || !isDurableStore(bootstrap.store)) {
      return bootstrap;
    }
    const store = bootstrap.store;
    const wrappedStore: ClientSaveDurableStore = {
      ...store,
      persistPreparedIntentWithExactPayload: async (args) => {
        const result = await store.persistPreparedIntentWithExactPayload(args);
        if (result.kind === "created" || result.kind === "already_exists") {
          durableAtMs = Date.now();
          input.onEvent({
            stage: "PENDING_DURABLE",
            saveOperationIdAlias: aliasSaveOperationId(result.intent.saveOperationId),
            payloadHash: result.intent.requestFingerprint,
            intentStatus: result.intent.status,
            stableActorClass: classifyStableActorKey(result.intent.stableActorKey),
            note: "durable_intent_and_exact_payload_committed",
          });
        }
        return result;
      },
    };
    return { status: "ready", store: wrappedStore };
  };

  const maybeInterrupt = async (
    run: () => Promise<Response>,
    payloadHint?: JournalCreatePayload | string,
  ): Promise<Response> => {
    postBeginAtMs = Date.now();
    let saveOperationIdAlias: string | undefined;
    let payloadHash: string | undefined;
    if (typeof payloadHint === "string") {
      try {
        const parsed = JSON.parse(payloadHint) as {
          saveOperationId?: string;
          requestFingerprint?: string;
        };
        if (parsed.saveOperationId) {
          saveOperationIdAlias = aliasSaveOperationId(parsed.saveOperationId);
        }
      } catch {
        /* ignore */
      }
    } else if (payloadHint && typeof payloadHint.saveOperationId === "string") {
      saveOperationIdAlias = aliasSaveOperationId(payloadHint.saveOperationId);
    }
    const persistBeforePostOk =
      durableAtMs != null && postBeginAtMs != null ? durableAtMs <= postBeginAtMs : null;
    input.onEvent({
      stage: "POST_BEGIN",
      saveOperationIdAlias,
      payloadHash,
      persistBeforePostOk,
      note: input.interruptAfterPersist
        ? "controlled_interrupt_armed"
        : "post_begin_no_interrupt",
    });
    if (input.interruptAfterPersist) {
      throw new Error(X66B_CONTROLLED_INTERRUPT_ERROR);
    }
    return run();
  };

  return {
    bootstrap: wrapBootstrap,
    capability: base.capability,
    post: (payload) => maybeInterrupt(() => base.post(payload), payload),
    postExactJson: (requestJson) =>
      maybeInterrupt(
        () =>
          base.postExactJson
            ? base.postExactJson(requestJson)
            : base.post(JSON.parse(requestJson) as JournalCreatePayload),
        requestJson,
      ),
    lookup: base.lookup,
  };
}
