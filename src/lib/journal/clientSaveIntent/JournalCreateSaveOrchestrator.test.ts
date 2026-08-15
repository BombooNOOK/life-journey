import { describe, expect, it, vi } from "vitest";

import {
  continueJournalCreateSaveRecovery,
  continueCurrentSessionJournalCreateSaveRecovery,
  clearCurrentSessionJournalCreatePayloadsForTest,
  recoverJournalCreateSaves,
  runForegroundJournalCreateRecovery,
  runJournalCreateSave,
  type JournalCreateSaveOrchestratorDeps,
} from "@/lib/journal/clientSaveIntent/JournalCreateSaveOrchestrator";
import { createMemoryClientSaveOperationIntentStore } from "@/lib/journal/clientSaveIntent/memoryStore";
import { prepareClientSaveOperationIntent } from "@/lib/journal/clientSaveIntent/ClientSaveOperationIntentService";

const payload = {
  content: "canonical body",
  mood: "calm",
  activity: "record_anyway",
  companionType: "owl",
  designTheme: "simple_plain",
  contentFontMode: "standard",
  entryDate: "2026-08-15",
  profileId: "profile_1",
  includeInBook: true,
};

function deps(overrides: Partial<JournalCreateSaveOrchestratorDeps> = {}) {
  const store = createMemoryClientSaveOperationIntentStore();
  const post = vi.fn(async (_input: unknown) =>
    new Response(JSON.stringify({ entry: { id: "entry_1" } }), { status: 200 }),
  );
  return {
    store,
    post,
    deps: {
      bootstrap: async () => ({ status: "ready" as const, store }),
      capability: async () => ({ kind: "enabled" as const }),
      post,
      lookup: async () => new Response(JSON.stringify({ state: "not_found" }), { status: 200 }),
      ...overrides,
    } satisfies JournalCreateSaveOrchestratorDeps,
  };
}

async function pending(store: ReturnType<typeof createMemoryClientSaveOperationIntentStore>, status: "awaiting_result" | "server_completed" = "awaiting_result") {
  const prepared = await prepareClientSaveOperationIntent(store, {
    viewerEmail: "person@example.com",
    requestFingerprint: "v1|fingerprint",
    saveOperationId: "01HXSAVEOPERATIONID00000001",
  });
  const awaiting = await store.update({
    ...prepared.intent,
    status: "awaiting_result",
  });
  if (status === "awaiting_result") return awaiting;
  return store.update({ ...awaiting, status: "server_completed", serverEntryId: "entry_existing" });
}

describe("common Journal create-save orchestrator", () => {
  it("keeps browser/disabled/unavailable admission on legacy POST", async () => {
    const post = vi.fn(async () => new Response(JSON.stringify({ entry: { id: "legacy" } })));
    const result = await runJournalCreateSave(
      { viewerEmail: "person@example.com", payload },
      {
        bootstrap: async () => ({ status: "unsupported_platform" }),
        capability: async () => ({ kind: "unavailable" }),
        post,
        lookup: async () => new Response(),
      },
    );
    expect(result.kind).toBe("legacy");
    expect(post).toHaveBeenCalledWith(payload);
  });

  it("durably prepares before attaching its one saveOperationId to POST", async () => {
    const { deps: injected, store, post } = deps();
    const result = await runJournalCreateSave(
      { viewerEmail: "Person@example.com", payload },
      injected,
    );
    expect(result.kind).toBe("completed");
    const sent = post.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(sent.saveOperationId).toMatch(/^[0-9A-Za-z_-]{16,64}$/);
    expect("actorKey" in sent).toBe(false);
    expect(await store.findByActorAndSaveOperationId("person@example.com", String(sent.saveOperationId))).toMatchObject({
      status: "completed",
      serverEntryId: "entry_1",
    });
  });

  it("does not POST if preparation fails after protocol admission", async () => {
    const { deps: injected, post } = deps({
      bootstrap: async () => ({
        status: "ready",
        store: {
          findByActorAndSaveOperationId: async () => null,
          tryInsert: async () => {
            throw new Error("disk_failure");
          },
          update: async () => {
            throw new Error("unreachable");
          },
          listRecoverableByActor: async () => [],
          deleteByActor: async () => 0,
        },
      }),
    });
    await expect(runJournalCreateSave({ viewerEmail: "person@example.com", payload }, injected)).resolves.toEqual({
      kind: "protocol_start_failed",
      reason: "intent_prepare_failed",
    });
    expect(post).not.toHaveBeenCalled();
  });

  it("preserves awaiting_result on transport ambiguity and never falls back to legacy", async () => {
    const failedPost = vi.fn(async () => {
        throw new Error("network_lost");
      });
    const { deps: injected, store } = deps({
      post: failedPost,
    });
    const result = await runJournalCreateSave({ viewerEmail: "person@example.com", payload }, injected);
    expect(result.kind).toBe("processing");
    if (result.kind === "processing") {
      expect(result.intent.status).toBe("awaiting_result");
      expect(await store.findByActorAndSaveOperationId("person@example.com", result.intent.saveOperationId)).toMatchObject({
        status: "awaiting_result",
      });
    }
    expect(failedPost).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["completed", { state: "completed", entryId: "entry_recovered" }, "completed"],
    ["processing", { state: "processing" }, "processing"],
    ["failed", { state: "failed_final" }, "failed_final"],
    ["mismatch", { state: "fingerprint_mismatch" }, "recovery_required"],
  ])("awaiting intent lookup %s never POSTs", async (_name, lookupBody, expected) => {
    const { deps: injected, store, post } = deps({
      lookup: async () => new Response(JSON.stringify(lookupBody)),
    });
    await pending(store);
    const results = await recoverJournalCreateSaves(
      { viewerEmail: "person@example.com" },
      injected,
    );
    expect(results[0]?.kind).toBe(expected);
    expect(post).not.toHaveBeenCalled();
  });

  it("keeps not_found pending without payload replay, including rollout OFF", async () => {
    const { deps: injected, store, post } = deps({
      capability: async () => ({ kind: "disabled" }),
      lookup: async () => new Response(JSON.stringify({ state: "not_found" })),
    });
    await pending(store);
    const results = await recoverJournalCreateSaves(
      { viewerEmail: "person@example.com" },
      injected,
    );
    expect(results[0]).toMatchObject({ kind: "recovery_required" });
    expect(post).not.toHaveBeenCalled();
  });

  it("finishes server_completed locally without lookup or POST", async () => {
    const { deps: injected, store, post } = deps();
    await pending(store, "server_completed");
    const lookup = vi.fn(injected.lookup);
    const results = await recoverJournalCreateSaves(
      { viewerEmail: "person@example.com" },
      { ...injected, lookup },
    );
    expect(results[0]).toMatchObject({ kind: "completed", entryId: "entry_existing" });
    expect(lookup).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });

  it("does not fall back to legacy when pending capability lookup is unavailable", async () => {
    const { deps: injected, store, post } = deps({ capability: async () => ({ kind: "unavailable" }) });
    await pending(store);
    const results = await recoverJournalCreateSaves(
      { viewerEmail: "person@example.com" },
      injected,
    );
    expect(results[0]).toMatchObject({ kind: "recovery_required", reason: "capability_unavailable" });
    expect(post).not.toHaveBeenCalled();
  });

  it("does not touch an intent whose actor snapshot differs from the foreground actor", async () => {
    const { deps: injected, store, post } = deps();
    const foreign = await pending(store);
    const lookup = vi.fn(injected.lookup);
    const results = await recoverJournalCreateSaves(
      { viewerEmail: "person@example.com" },
      {
        ...injected,
        lookup,
        bootstrap: async () => ({
          status: "ready",
          store: { ...store, listRecoverableByActor: async () => [{ ...foreign, actorKey: "other@example.com" }] },
        }),
      },
    );
    expect(results[0]).toMatchObject({ kind: "recovery_required", reason: "actor_mismatch" });
    expect(lookup).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });

  it("single-flights duplicate foreground mounts", async () => {
    const { deps: injected, store } = deps();
    await pending(store);
    const lookup = vi.fn(async () => new Response(JSON.stringify({ state: "processing" })));
    const shared = { ...injected, lookup };
    await Promise.all([
      runForegroundJournalCreateRecovery({ viewerEmail: "person@example.com" }, shared),
      runForegroundJournalCreateRecovery({ viewerEmail: "person@example.com" }, shared),
    ]);
    expect(lookup).toHaveBeenCalledTimes(1);
  });

  it("replays only an explicit, fingerprint-matched payload with the same operation id", async () => {
    const store = createMemoryClientSaveOperationIntentStore();
    const post = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 202 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ entry: { id: "entry_replayed" } }), { status: 200 }));
    const injected: JournalCreateSaveOrchestratorDeps = {
      bootstrap: async () => ({ status: "ready", store }),
      capability: async () => ({ kind: "enabled" }),
      post,
      lookup: async () => new Response(JSON.stringify({ state: "not_found" })),
    };
    const initial = await runJournalCreateSave({ viewerEmail: "person@example.com", payload }, injected);
    expect(initial.kind).toBe("processing");
    if (initial.kind !== "processing") return;
    const resumed = await continueJournalCreateSaveRecovery(
      { viewerEmail: "person@example.com", saveOperationId: initial.intent.saveOperationId, payload },
      injected,
    );
    expect(resumed).toMatchObject({ kind: "completed", entryId: "entry_replayed" });
    expect(post.mock.calls[1]?.[0]).toMatchObject({ saveOperationId: initial.intent.saveOperationId });
  });

  it("offers, but does not perform, a current-session exact continuation on not_found", async () => {
    clearCurrentSessionJournalCreatePayloadsForTest();
    const store = createMemoryClientSaveOperationIntentStore();
    const post = vi.fn(async () => new Response(JSON.stringify({}), { status: 202 }));
    const injected: JournalCreateSaveOrchestratorDeps = {
      bootstrap: async () => ({ status: "ready", store }),
      capability: async () => ({ kind: "enabled" }),
      post,
      lookup: async () => new Response(JSON.stringify({ state: "not_found" })),
    };
    const initial = await runJournalCreateSave({ viewerEmail: "person@example.com", payload }, injected);
    if (initial.kind !== "processing") throw new Error("expected pending intent");
    const mounted = await recoverJournalCreateSaves({ viewerEmail: "person@example.com" }, injected);
    expect(mounted[0]).toMatchObject({ kind: "continuation_available" });
    expect(post).toHaveBeenCalledTimes(1);
    await continueCurrentSessionJournalCreateSaveRecovery(
      { viewerEmail: "person@example.com", saveOperationId: initial.intent.saveOperationId },
      { ...injected, post: async () => new Response(JSON.stringify({ entry: { id: "continued" } }), { status: 200 }) },
    );
  });

  it("treats a restart-cleared session payload as recovery_required without POST", async () => {
    clearCurrentSessionJournalCreatePayloadsForTest();
    const store = createMemoryClientSaveOperationIntentStore();
    const post = vi.fn(async () => new Response(JSON.stringify({}), { status: 202 }));
    const injected: JournalCreateSaveOrchestratorDeps = {
      bootstrap: async () => ({ status: "ready", store }),
      capability: async () => ({ kind: "enabled" }),
      post,
      lookup: async () => new Response(JSON.stringify({ state: "not_found" })),
    };
    await runJournalCreateSave({ viewerEmail: "person@example.com", payload }, injected);
    expect((await recoverJournalCreateSaves({ viewerEmail: "person@example.com" }, injected))[0]?.kind).toBe(
      "continuation_available",
    );
    clearCurrentSessionJournalCreatePayloadsForTest();
    const afterRestart = await recoverJournalCreateSaves({ viewerEmail: "person@example.com" }, injected);
    expect(afterRestart[0]).toMatchObject({ kind: "recovery_required" });
    expect(post).toHaveBeenCalledTimes(1);
    const recovered = afterRestart[0];
    if (!recovered || recovered.kind !== "recovery_required") throw new Error("expected recovery_required");
    expect(await store.findByActorAndSaveOperationId("person@example.com", recovered.intent.saveOperationId)).not.toBeNull();
  });

  it("single-flights duplicate explicit continuation and releases after failure", async () => {
    clearCurrentSessionJournalCreatePayloadsForTest();
    const store = createMemoryClientSaveOperationIntentStore();
    let releasePost: (() => void) | undefined;
    const post = vi.fn(async () => {
      await new Promise<void>((resolve) => {
        releasePost = resolve;
      });
      throw new Error("transport_lost");
    });
    const injected: JournalCreateSaveOrchestratorDeps = {
      bootstrap: async () => ({ status: "ready", store }),
      capability: async () => ({ kind: "enabled" }),
      post,
      lookup: async () => new Response(JSON.stringify({ state: "not_found" })),
    };
    const initial = await runJournalCreateSave(
      { viewerEmail: "person@example.com", payload },
      { ...injected, post: async () => new Response(JSON.stringify({}), { status: 202 }) },
    );
    if (initial.kind !== "processing") throw new Error("expected pending intent");
    const one = continueCurrentSessionJournalCreateSaveRecovery(
      { viewerEmail: "person@example.com", saveOperationId: initial.intent.saveOperationId },
      injected,
    );
    const two = continueCurrentSessionJournalCreateSaveRecovery(
      { viewerEmail: "person@example.com", saveOperationId: initial.intent.saveOperationId },
      injected,
    );
    await vi.waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    releasePost?.();
    await Promise.all([one, two]);
    expect(post).toHaveBeenCalledTimes(1);
    const retry = await continueCurrentSessionJournalCreateSaveRecovery(
      { viewerEmail: "person@example.com", saveOperationId: initial.intent.saveOperationId },
      { ...injected, post: async () => new Response(JSON.stringify({}), { status: 202 }) },
    );
    expect(retry.kind).toBe("processing");
  });
});
