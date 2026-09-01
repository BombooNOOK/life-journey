import { canonicalizeExactJournalSavePayload } from "@/lib/journal/clientSaveIntent/exactPayloadCanonical";
import {
  AI7_DEVICE_RECOVERY_TEST_ACTOR,
  AI7_PHOTO_SAVE_OPERATION_ID,
  AI7_TEST_DRAFT_REF,
  AI7_TEXT_SAVE_OPERATION_ID,
} from "@/lib/journal/clientSaveIntent/ai7DeviceRecoveryHarness/constants";
import {
  evaluateAi7DeviceRecoveryHarnessGate,
  type Ai7DeviceRecoveryHarnessGateInput,
} from "@/lib/journal/clientSaveIntent/ai7DeviceRecoveryHarness/gate";
import {
  createAi7FakeOrchestratorDeps,
  type Ai7FakeJournalTransport,
} from "@/lib/journal/clientSaveIntent/ai7DeviceRecoveryHarness/fakeTransport";
import {
  ai7PhotoTestPayload,
  ai7TextTestPayload,
} from "@/lib/journal/clientSaveIntent/ai7DeviceRecoveryHarness/payloads";
import {
  clearCurrentSessionJournalCreatePayloadsForTest,
  recoverJournalCreateSaves,
  type JournalCreatePayload,
  type JournalCreateSaveResult,
} from "@/lib/journal/clientSaveIntent/JournalCreateSaveOrchestrator";
import { normalizeClientActorKey } from "@/lib/journal/clientSaveIntent/saveOperationId";
import type {
  ClientSaveDurableStore,
  ClientSaveOperationIntent,
  ClientSaveOperationIntentStore,
} from "@/lib/journal/clientSaveIntent/types";

export type Ai7HarnessKind = "text" | "photo";

export type Ai7InspectOperation = {
  kind: Ai7HarnessKind;
  present: boolean;
  status: ClientSaveOperationIntent["status"] | "absent";
  payloadPresent: boolean;
  fingerprintVerified: boolean;
  payloadExact: boolean;
  pending: boolean;
  completed: boolean;
};

export type Ai7InspectSnapshot = {
  pendingTestOperationExists: boolean;
  operations: Ai7InspectOperation[];
};

export type Ai7HarnessDeps = {
  store: ClientSaveDurableStore;
  gate?: Ai7DeviceRecoveryHarnessGateInput;
  fake?: Ai7FakeJournalTransport;
};

function requireOperations(gate: Ai7DeviceRecoveryHarnessGateInput | undefined) {
  const result = evaluateAi7DeviceRecoveryHarnessGate({
    isNativePlatform: true,
    ...gate,
  });
  if (!result.operationsAllowed) {
    return result;
  }
  return result;
}

function isDurableStore(
  store: ClientSaveOperationIntentStore,
): store is ClientSaveDurableStore {
  return (
    typeof (store as ClientSaveDurableStore).persistPreparedIntentWithExactPayload ===
      "function" &&
    typeof (store as ClientSaveDurableStore).loadExactPayloadBySaveOperationId ===
      "function"
  );
}

function newIntentId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return `intent_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export function isAi7DeviceRecoveryTestActor(actorKey: string): boolean {
  return normalizeClientActorKey(actorKey) === AI7_DEVICE_RECOVERY_TEST_ACTOR;
}

function operationIdFor(kind: Ai7HarnessKind): string {
  return kind === "photo" ? AI7_PHOTO_SAVE_OPERATION_ID : AI7_TEXT_SAVE_OPERATION_ID;
}

function payloadFor(kind: Ai7HarnessKind): JournalCreatePayload {
  return kind === "photo" ? ai7PhotoTestPayload() : ai7TextTestPayload();
}

export async function persistAi7DeviceRecoveryTestOperation(
  kind: Ai7HarnessKind,
  deps: Ai7HarnessDeps,
): Promise<
  | { kind: "unavailable"; reason: string }
  | { kind: "persisted"; harnessKind: Ai7HarnessKind; status: ClientSaveOperationIntent["status"] }
  | { kind: "rejected"; reason: string }
> {
  const gate = requireOperations(deps.gate);
  if (!gate.operationsAllowed) {
    return { kind: "unavailable", reason: gate.reason };
  }
  if (!isDurableStore(deps.store)) {
    return { kind: "rejected", reason: "store_not_durable" };
  }
  const saveOperationId = operationIdFor(kind);
  const payload = payloadFor(kind);
  const canonical = canonicalizeExactJournalSavePayload({
    saveOperationId,
    payload,
  });
  if (!canonical.ok) {
    return { kind: "rejected", reason: `payload_rejected:${canonical.code}` };
  }
  const now = new Date().toISOString();
  const prepared: ClientSaveOperationIntent = {
    intentId: newIntentId(),
    saveOperationId,
    actorKey: AI7_DEVICE_RECOVERY_TEST_ACTOR,
    stableActorKey: null,
    draftRef: AI7_TEST_DRAFT_REF,
    requestFingerprint: canonical.requestFingerprint,
    status: "prepared",
    serverEntryId: null,
    failureCode: null,
    createdAt: now,
    updatedAt: now,
    lastAttemptAt: null,
    completedAt: null,
  };
  const persisted = await deps.store.persistPreparedIntentWithExactPayload({
    intent: prepared,
    payload,
  });
  if (persisted.kind !== "created" && persisted.kind !== "already_exists") {
    return { kind: "rejected", reason: persisted.kind };
  }
  let intent = persisted.intent;
  if (intent.status === "prepared") {
    intent = await deps.store.update({
      ...intent,
      status: "awaiting_result",
      lastAttemptAt: now,
      updatedAt: now,
    });
  }
  return { kind: "persisted", harnessKind: kind, status: intent.status };
}

export async function inspectAi7DeviceRecoveryTestOperations(
  deps: Ai7HarnessDeps,
): Promise<Ai7InspectSnapshot | { kind: "unavailable"; reason: string }> {
  const gate = requireOperations(deps.gate);
  if (!gate.operationsAllowed) {
    return { kind: "unavailable", reason: gate.reason };
  }
  const operations: Ai7InspectOperation[] = [];
  for (const kind of ["text", "photo"] as const) {
    const saveOperationId = operationIdFor(kind);
    const intent = await deps.store.findByActorAndSaveOperationId(
      AI7_DEVICE_RECOVERY_TEST_ACTOR,
      saveOperationId,
    );
    if (!intent) {
      operations.push({
        kind,
        present: false,
        status: "absent",
        payloadPresent: false,
        fingerprintVerified: false,
        payloadExact: false,
        pending: false,
        completed: false,
      });
      continue;
    }
    const loaded = await deps.store.loadExactPayloadBySaveOperationId(saveOperationId);
    const payloadPresent = loaded.kind === "ok";
    const fingerprintVerified =
      loaded.kind === "ok" && loaded.payload.requestFingerprint === intent.requestFingerprint;
    const payloadExact =
      loaded.kind === "ok" &&
      loaded.request.saveOperationId === saveOperationId &&
      loaded.payload.requestJson.length > 0;
    operations.push({
      kind,
      present: true,
      status: intent.status,
      payloadPresent,
      fingerprintVerified,
      payloadExact,
      pending:
        intent.status === "prepared" ||
        intent.status === "awaiting_result" ||
        intent.status === "server_completed" ||
        intent.status === "recovery_required",
      completed: intent.status === "completed",
    });
  }
  return {
    pendingTestOperationExists: operations.some((row) => row.pending),
    operations,
  };
}

export async function recoverAi7DeviceRecoveryTestOperations(
  deps: Ai7HarnessDeps,
): Promise<
  | { kind: "unavailable"; reason: string }
  | {
      kind: "recovered";
      results: JournalCreateSaveResult[];
      postCalls: number;
      lookupCalls: number;
    }
> {
  const gate = requireOperations(deps.gate);
  if (!gate.operationsAllowed) {
    return { kind: "unavailable", reason: gate.reason };
  }
  const orchestratorDeps = createAi7FakeOrchestratorDeps(
    async () => ({ status: "ready", store: deps.store }),
    deps.fake,
  );
  const results = await recoverJournalCreateSaves(
    { viewerEmail: AI7_DEVICE_RECOVERY_TEST_ACTOR },
    orchestratorDeps,
  );
  return {
    kind: "recovered",
    results,
    postCalls: orchestratorDeps.fake.postCalls,
    lookupCalls: orchestratorDeps.fake.lookupCalls,
  };
}

export async function cleanupAi7DeviceRecoveryTestOperations(
  deps: Ai7HarnessDeps & { actorKey?: string },
): Promise<
  | { kind: "unavailable"; reason: string }
  | { kind: "rejected"; reason: "actor_not_test_namespace" }
  | { kind: "cleaned"; deletedIntentCount: number }
> {
  const gate = requireOperations(deps.gate);
  if (!gate.operationsAllowed) {
    return { kind: "unavailable", reason: gate.reason };
  }
  const requested = normalizeClientActorKey(
    deps.actorKey ?? AI7_DEVICE_RECOVERY_TEST_ACTOR,
  );
  if (!isAi7DeviceRecoveryTestActor(requested)) {
    return { kind: "rejected", reason: "actor_not_test_namespace" };
  }
  const deletedIntentCount = await deps.store.deleteByActor(AI7_DEVICE_RECOVERY_TEST_ACTOR);
  clearCurrentSessionJournalCreatePayloadsForTest();
  return { kind: "cleaned", deletedIntentCount };
}
