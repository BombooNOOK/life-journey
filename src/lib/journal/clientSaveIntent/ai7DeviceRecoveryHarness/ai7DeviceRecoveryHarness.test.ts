import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import {
  AI7_DEVICE_RECOVERY_TEST_ACTOR,
  AI7_PHOTO_SAVE_OPERATION_ID,
  AI7_TEXT_SAVE_OPERATION_ID,
  cleanupAi7DeviceRecoveryTestOperations,
  createAi7FakeJournalTransport,
  evaluateAi7DeviceRecoveryHarnessGate,
  inspectAi7DeviceRecoveryTestOperations,
  isAi7DeviceRecoveryHarnessPageAllowed,
  persistAi7DeviceRecoveryTestOperation,
  recoverAi7DeviceRecoveryTestOperations,
} from "@/lib/journal/clientSaveIntent/ai7DeviceRecoveryHarness";
import { canonicalizeExactJournalSavePayload } from "@/lib/journal/clientSaveIntent/exactPayloadCanonical";
import { ai7PhotoTestPayload, ai7TextTestPayload } from "@/lib/journal/clientSaveIntent/ai7DeviceRecoveryHarness/payloads";
import { clearCurrentSessionJournalCreatePayloadsForTest } from "@/lib/journal/clientSaveIntent/JournalCreateSaveOrchestrator";
import { createMemoryClientSaveOperationIntentStore } from "@/lib/journal/clientSaveIntent/memoryStore";
import type { ClientSaveDurableStore } from "@/lib/journal/clientSaveIntent/types";

const enabledGate = {
  nodeEnv: "development",
  flag: "YES",
  isNativePlatform: true,
} as const;

function enabledStore(backing?: Parameters<typeof createMemoryClientSaveOperationIntentStore>[0]["backing"]) {
  return createMemoryClientSaveOperationIntentStore({ backing });
}

describe("AI-7 isolated device recovery harness", () => {
  it("keeps the fake transport free of real fetch", async () => {
    const source = readFileSync(
      path.join(
        process.cwd(),
        "src/lib/journal/clientSaveIntent/ai7DeviceRecoveryHarness/fakeTransport.ts",
      ),
      "utf8",
    );
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toMatch("/api/journal");
    expect(source).not.toMatch(/https?:\/\//);
    expect(source).not.toMatch("vercel");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const fake = createAi7FakeJournalTransport();
    await fake.postExactJson(
      JSON.stringify({ saveOperationId: AI7_TEXT_SAVE_OPERATION_ID, content: "x" }),
    );
    await fake.lookup({
      saveOperationId: AI7_TEXT_SAVE_OPERATION_ID,
      requestFingerprint: "fp",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("records zero real /api/journal adapter invocations during persist+recover", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const store = enabledStore();
    const fake = createAi7FakeJournalTransport();
    await persistAi7DeviceRecoveryTestOperation("text", { store, gate: enabledGate });
    await recoverAi7DeviceRecoveryTestOperations({ store, gate: enabledGate, fake });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(fake.postCalls).toBe(1);
    vi.unstubAllGlobals();
  });

  it("uses only the dedicated test actor", async () => {
    const store = enabledStore();
    await persistAi7DeviceRecoveryTestOperation("text", { store, gate: enabledGate });
    expect(
      await store.findByActorAndSaveOperationId("person@example.com", AI7_TEXT_SAVE_OPERATION_ID),
    ).toBeNull();
    expect(
      await store.findByActorAndSaveOperationId(
        AI7_DEVICE_RECOVERY_TEST_ACTOR,
        AI7_TEXT_SAVE_OPERATION_ID,
      ),
    ).toMatchObject({ actorKey: AI7_DEVICE_RECOVERY_TEST_ACTOR });
  });

  it("survives a simulated remount for the text payload", async () => {
    const backing = {
      rows: new Map(),
      payloads: new Map(),
      tombstones: new Map(),
    };
    const first = enabledStore(backing);
    await persistAi7DeviceRecoveryTestOperation("text", { store: first, gate: enabledGate });
    const remounted = enabledStore({
      rows: new Map(backing.rows),
      payloads: new Map(backing.payloads),
      tombstones: new Map(backing.tombstones),
    });
    const snapshot = await inspectAi7DeviceRecoveryTestOperations({
      store: remounted,
      gate: enabledGate,
    });
    expect("operations" in snapshot && snapshot.pendingTestOperationExists).toBe(true);
    if (!("operations" in snapshot)) return;
    const text = snapshot.operations.find((row) => row.kind === "text");
    expect(text).toMatchObject({
      payloadPresent: true,
      fingerprintVerified: true,
      payloadExact: true,
      pending: true,
    });
    const canonical = canonicalizeExactJournalSavePayload({
      saveOperationId: AI7_TEXT_SAVE_OPERATION_ID,
      payload: ai7TextTestPayload(),
    });
    expect(canonical.ok).toBe(true);
    if (!canonical.ok) return;
    const loaded = await remounted.loadExactPayloadBySaveOperationId(AI7_TEXT_SAVE_OPERATION_ID);
    expect(loaded.kind).toBe("ok");
    if (loaded.kind !== "ok") return;
    expect(loaded.payload.requestJson).toBe(canonical.requestJson);
  });

  it("survives a simulated remount for the photo payload", async () => {
    const backing = {
      rows: new Map(),
      payloads: new Map(),
      tombstones: new Map(),
    };
    const first = enabledStore(backing);
    await persistAi7DeviceRecoveryTestOperation("photo", { store: first, gate: enabledGate });
    const remounted = enabledStore({
      rows: new Map(backing.rows),
      payloads: new Map(backing.payloads),
      tombstones: new Map(backing.tombstones),
    });
    const loaded = await remounted.loadExactPayloadBySaveOperationId(AI7_PHOTO_SAVE_OPERATION_ID);
    expect(loaded.kind).toBe("ok");
    if (loaded.kind !== "ok") return;
    const canonical = canonicalizeExactJournalSavePayload({
      saveOperationId: AI7_PHOTO_SAVE_OPERATION_ID,
      payload: ai7PhotoTestPayload(),
    });
    expect(canonical.ok).toBe(true);
    if (!canonical.ok) return;
    expect(loaded.payload.requestJson).toBe(canonical.requestJson);
    expect(loaded.request.photoDataUrl).toBe(ai7PhotoTestPayload().photoDataUrl);
  });

  it("fake lookup not_found exact-replays once then simulated completed", async () => {
    clearCurrentSessionJournalCreatePayloadsForTest();
    const store = enabledStore();
    const fake = createAi7FakeJournalTransport();
    await persistAi7DeviceRecoveryTestOperation("text", { store, gate: enabledGate });
    const recovered = await recoverAi7DeviceRecoveryTestOperations({
      store,
      gate: enabledGate,
      fake,
    });
    expect(recovered.kind).toBe("recovered");
    if (recovered.kind !== "recovered") return;
    expect(recovered.lookupCalls).toBe(1);
    expect(recovered.postCalls).toBe(1);
    expect(recovered.results[0]).toMatchObject({ kind: "completed" });
    expect(
      await store.findByActorAndSaveOperationId(
        AI7_DEVICE_RECOVERY_TEST_ACTOR,
        AI7_TEXT_SAVE_OPERATION_ID,
      ),
    ).toMatchObject({ status: "completed" });
  });

  it("does not replay after fake completed", async () => {
    clearCurrentSessionJournalCreatePayloadsForTest();
    const store = enabledStore();
    const fake = createAi7FakeJournalTransport();
    await persistAi7DeviceRecoveryTestOperation("text", { store, gate: enabledGate });
    await recoverAi7DeviceRecoveryTestOperations({ store, gate: enabledGate, fake });
    const second = await recoverAi7DeviceRecoveryTestOperations({
      store,
      gate: enabledGate,
      fake,
    });
    expect(second.kind).toBe("recovered");
    if (second.kind !== "recovered") return;
    expect(second.postCalls).toBe(1);
    expect(second.results).toEqual([]);
  });

  it("cleanup deletes only the test actor", async () => {
    const store = enabledStore();
    await persistAi7DeviceRecoveryTestOperation("text", { store, gate: enabledGate });
    await persistAi7DeviceRecoveryTestOperation("photo", { store, gate: enabledGate });
    const cleaned = await cleanupAi7DeviceRecoveryTestOperations({ store, gate: enabledGate });
    expect(cleaned).toEqual({ kind: "cleaned", deletedIntentCount: 2 });
    expect(
      await store.findByActorAndSaveOperationId(
        AI7_DEVICE_RECOVERY_TEST_ACTOR,
        AI7_TEXT_SAVE_OPERATION_ID,
      ),
    ).toBeNull();
  });

  it("rejects cleanup for a real user actor without deleting", async () => {
    const store = enabledStore();
    await persistAi7DeviceRecoveryTestOperation("text", { store, gate: enabledGate });
    const wrapped: ClientSaveDurableStore = {
      ...store,
      deleteByActor: async () => {
        throw new Error("deleteByActor_must_not_run");
      },
    };
    const rejected = await cleanupAi7DeviceRecoveryTestOperations({
      store: wrapped,
      gate: enabledGate,
      actorKey: "person@example.com",
    });
    expect(rejected).toEqual({ kind: "rejected", reason: "actor_not_test_namespace" });
    expect(
      await store.findByActorAndSaveOperationId(
        AI7_DEVICE_RECOVERY_TEST_ACTOR,
        AI7_TEXT_SAVE_OPERATION_ID,
      ),
    ).not.toBeNull();
  });

  it("Production build mode makes the harness unavailable", () => {
    expect(
      evaluateAi7DeviceRecoveryHarnessGate({
        nodeEnv: "production",
        flag: "YES",
        isNativePlatform: true,
      }),
    ).toMatchObject({ ok: false, reason: "production_build", pageAllowed: false });
    expect(
      isAi7DeviceRecoveryHarnessPageAllowed({ nodeEnv: "production", flag: "YES" }),
    ).toBe(false);
  });

  it("test flag OFF makes the harness unavailable", () => {
    expect(
      evaluateAi7DeviceRecoveryHarnessGate({
        nodeEnv: "development",
        flag: "",
        isNativePlatform: true,
      }),
    ).toMatchObject({ ok: false, reason: "flag_off", operationsAllowed: false, pageAllowed: false });
  });
});
