import { describe, expect, it, vi } from "vitest";

import {
  continueJournalCreateSaveRecovery,
  continueCurrentSessionJournalCreateSaveRecovery,
  clearCurrentSessionJournalCreatePayloadsForTest,
  recoverJournalCreateSaves,
  runForegroundJournalCreateRecovery,
  runJournalCreateSave,
  type JournalCreatePayload,
  type JournalCreateSaveOrchestratorDeps,
} from "@/lib/journal/clientSaveIntent/JournalCreateSaveOrchestrator";
import { createMemoryClientSaveOperationIntentStore } from "@/lib/journal/clientSaveIntent/memoryStore";
import { prepareClientSaveOperationIntent } from "@/lib/journal/clientSaveIntent/ClientSaveOperationIntentService";
import type { ClientSaveDurableStore } from "@/lib/journal/clientSaveIntent/types";

const payload: JournalCreatePayload = {
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

/** AI-7.1-era metadata-only intent: no request_json row. */
async function metadataOnlyPending(
  store: ReturnType<typeof createMemoryClientSaveOperationIntentStore>,
  status: "awaiting_result" | "server_completed" = "awaiting_result",
) {
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

function postedBody(post: ReturnType<typeof vi.fn>, call = 0): Record<string, unknown> {
  const raw = post.mock.calls[call]?.[0];
  if (typeof raw === "string") return JSON.parse(raw) as Record<string, unknown>;
  return raw as Record<string, unknown>;
}

function createSimulatedJournalServer() {
  const entries = new Map<string, string>();
  const charges = new Map<string, number>();
  const post = vi.fn(async (input: unknown) => {
    const body =
      typeof input === "string"
        ? (JSON.parse(input) as Record<string, unknown>)
        : (input as Record<string, unknown>);
    const op = String(body.saveOperationId ?? "");
    if (!entries.has(op)) {
      entries.set(op, `entry_${entries.size + 1}`);
      charges.set(op, 1);
    }
    return new Response(JSON.stringify({ entry: { id: entries.get(op) } }), { status: 200 });
  });
  const lookup = vi.fn(async (input: { saveOperationId: string }) => {
    const id = entries.get(input.saveOperationId);
    if (!id) return new Response(JSON.stringify({ state: "not_found" }), { status: 200 });
    return new Response(JSON.stringify({ state: "completed", entryId: id }), { status: 200 });
  });
  return { entries, charges, post, lookup };
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

  it("persists exact payload before the first protocol POST", async () => {
    const store = createMemoryClientSaveOperationIntentStore();
    const order: string[] = [];
    const wrapped: ClientSaveDurableStore = {
      ...store,
      persistPreparedIntentWithExactPayload: async (input) => {
        order.push("persist");
        return store.persistPreparedIntentWithExactPayload(input);
      },
    };
    const post = vi.fn(async (input: unknown) => {
      order.push("post");
      const body = typeof input === "string" ? JSON.parse(input) : input;
      expect(body).toMatchObject({ saveOperationId: expect.any(String), profileId: "profile_1" });
      return new Response(JSON.stringify({ entry: { id: "entry_1" } }), { status: 200 });
    });
    const result = await runJournalCreateSave(
      { viewerEmail: "Person@example.com", payload },
      {
        bootstrap: async () => ({ status: "ready", store: wrapped }),
        capability: async () => ({ kind: "enabled" }),
        post,
        lookup: async () => new Response(),
      },
    );
    expect(result.kind).toBe("completed");
    expect(order).toEqual(["persist", "post"]);
    const sent = postedBody(post);
    expect(sent.saveOperationId).toMatch(/^[0-9A-Za-z_-]{16,64}$/);
    expect("actorKey" in sent).toBe(false);
    expect("email" in sent).toBe(false);
    expect(
      await store.findByActorAndSaveOperationId("person@example.com", String(sent.saveOperationId)),
    ).toMatchObject({
      status: "completed",
      serverEntryId: "entry_1",
    });
    expect(await store.loadExactPayloadBySaveOperationId(String(sent.saveOperationId))).toMatchObject({
      kind: "ok",
    });
  });

  it("does not POST if persist fails after protocol admission", async () => {
    const { store, post } = deps();
    const injected: JournalCreateSaveOrchestratorDeps = {
      bootstrap: async () => ({
        status: "ready",
        store: {
          ...store,
          persistPreparedIntentWithExactPayload: async () => {
            throw new Error("disk_failure");
          },
        },
      }),
      capability: async () => ({ kind: "enabled" }),
      post,
      lookup: async () => new Response(),
    };
    await expect(runJournalCreateSave({ viewerEmail: "person@example.com", payload }, injected)).resolves.toEqual({
      kind: "protocol_start_failed",
      reason: "intent_prepare_failed",
    });
    expect(post).not.toHaveBeenCalled();
  });

  it("returns pending on POST timeout and keeps intent+payload", async () => {
    const failedPost = vi.fn(async () => {
      throw new Error("network_lost");
    });
    const { deps: injected, store } = deps({
      post: failedPost,
    });
    const result = await runJournalCreateSave({ viewerEmail: "person@example.com", payload }, injected);
    expect(result.kind).toBe("pending");
    if (result.kind !== "pending") return;
    expect(result.recoveryState).toBe("pending");
    expect(result.intent.status).toBe("awaiting_result");
    expect(
      await store.findByActorAndSaveOperationId("person@example.com", result.intent.saveOperationId),
    ).toMatchObject({ status: "awaiting_result" });
    expect(await store.loadExactPayloadBySaveOperationId(result.intent.saveOperationId)).toMatchObject({
      kind: "ok",
    });
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
    await metadataOnlyPending(store);
    const results = await recoverJournalCreateSaves({ viewerEmail: "person@example.com" }, injected);
    expect(results[0]?.kind).toBe(expected);
    expect(post).not.toHaveBeenCalled();
  });

  it("fail-closes metadata-only legacy intents on lookup not_found", async () => {
    const { deps: injected, store, post } = deps({
      capability: async () => ({ kind: "disabled" }),
      lookup: async () => new Response(JSON.stringify({ state: "not_found" })),
    });
    await metadataOnlyPending(store);
    const results = await recoverJournalCreateSaves({ viewerEmail: "person@example.com" }, injected);
    expect(results[0]).toMatchObject({
      kind: "recovery_required",
      recoveryState: "recovery_required",
      reason: "PAYLOAD_UNAVAILABLE",
    });
    expect(post).not.toHaveBeenCalled();
  });

  it("finishes server_completed locally without lookup or POST", async () => {
    const { deps: injected, store, post } = deps();
    await metadataOnlyPending(store, "server_completed");
    const lookup = vi.fn(injected.lookup);
    const results = await recoverJournalCreateSaves(
      { viewerEmail: "person@example.com" },
      { ...injected, lookup },
    );
    expect(results[0]).toMatchObject({ kind: "completed", entryId: "entry_existing" });
    expect(lookup).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });

  it("still looks up when capability is unavailable and never falls back to legacy", async () => {
    const { store, post } = deps();
    await metadataOnlyPending(store);
    const lookup = vi.fn(async () => new Response(JSON.stringify({ state: "processing" })));
    const results = await recoverJournalCreateSaves(
      { viewerEmail: "person@example.com" },
      {
        bootstrap: async () => ({ status: "ready", store }),
        capability: async () => ({ kind: "unavailable" }),
        post,
        lookup,
      },
    );
    expect(lookup).toHaveBeenCalledTimes(1);
    expect(results[0]).toMatchObject({ kind: "processing", recoveryState: "processing" });
    expect(post).not.toHaveBeenCalled();
  });

  it("does not touch an intent whose actor snapshot differs from the foreground actor", async () => {
    const { deps: injected, store, post } = deps();
    const foreign = await metadataOnlyPending(store);
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
    await metadataOnlyPending(store);
    const lookup = vi.fn(async () => new Response(JSON.stringify({ state: "processing" })));
    const shared = { ...injected, lookup };
    await Promise.all([
      runForegroundJournalCreateRecovery({ viewerEmail: "person@example.com" }, shared),
      runForegroundJournalCreateRecovery({ viewerEmail: "person@example.com" }, shared),
    ]);
    expect(lookup).toHaveBeenCalledTimes(1);
  });

  it("restart lookup completed binds the server entry and never replays", async () => {
    const simulated = createSimulatedJournalServer();
    const store = createMemoryClientSaveOperationIntentStore();
    let first = true;
    const post = vi.fn(async (input: unknown) => {
      if (first) {
        first = false;
        await simulated.post(input);
        throw new Error("timeout_after_server_success");
      }
      return simulated.post(input);
    });
    const injected: JournalCreateSaveOrchestratorDeps = {
      bootstrap: async () => ({ status: "ready", store }),
      capability: async () => ({ kind: "enabled" }),
      post,
      lookup: simulated.lookup,
    };
    const initial = await runJournalCreateSave({ viewerEmail: "person@example.com", payload }, injected);
    expect(initial.kind).toBe("pending");
    if (initial.kind !== "pending") return;
    const recovered = await recoverJournalCreateSaves({ viewerEmail: "person@example.com" }, injected);
    expect(recovered[0]).toMatchObject({
      kind: "completed",
      recoveryState: "completed",
      entryId: "entry_1",
    });
    expect(post).toHaveBeenCalledTimes(1);
    expect(simulated.entries.size).toBe(1);
    expect([...simulated.charges.values()]).toEqual([1]);
  });

  it("restart lookup not_found exact-replays stored request_json once then completes", async () => {
    const store = createMemoryClientSaveOperationIntentStore();
    const post = vi
      .fn()
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValueOnce(new Response(JSON.stringify({ entry: { id: "entry_replayed" } }), { status: 200 }));
    const injected: JournalCreateSaveOrchestratorDeps = {
      bootstrap: async () => ({ status: "ready", store }),
      capability: async () => ({ kind: "enabled" }),
      post,
      lookup: async () => new Response(JSON.stringify({ state: "not_found" })),
    };
    const initial = await runJournalCreateSave({ viewerEmail: "person@example.com", payload }, injected);
    expect(initial.kind).toBe("pending");
    if (initial.kind !== "pending") return;
    const firstJson = postedBody(post, 0);
    const recovered = await recoverJournalCreateSaves({ viewerEmail: "person@example.com" }, injected);
    expect(recovered[0]).toMatchObject({
      kind: "completed",
      recoveryState: "completed",
      entryId: "entry_replayed",
    });
    expect(post).toHaveBeenCalledTimes(2);
    expect(postedBody(post, 1)).toEqual(firstJson);
    expect(postedBody(post, 1).saveOperationId).toBe(initial.intent.saveOperationId);
  });

  it("payload missing after crash is recovery_required with POST 0", async () => {
    const store = createMemoryClientSaveOperationIntentStore();
    const post = vi.fn(async () => {
      throw new Error("timeout");
    });
    const injected: JournalCreateSaveOrchestratorDeps = {
      bootstrap: async () => ({ status: "ready", store }),
      capability: async () => ({ kind: "enabled" }),
      post,
      lookup: async () => new Response(JSON.stringify({ state: "not_found" })),
    };
    const initial = await runJournalCreateSave({ viewerEmail: "person@example.com", payload }, injected);
    if (initial.kind !== "pending") throw new Error("expected pending");
    const missingStore: ClientSaveDurableStore = {
      ...store,
      loadExactPayloadBySaveOperationId: async () => ({ kind: "missing" }),
    };
    const recovered = await recoverJournalCreateSaves(
      { viewerEmail: "person@example.com" },
      { ...injected, bootstrap: async () => ({ status: "ready", store: missingStore }) },
    );
    expect(recovered[0]).toMatchObject({
      kind: "recovery_required",
      reason: "PAYLOAD_UNAVAILABLE",
    });
    expect(post).toHaveBeenCalledTimes(1);
  });

  it("fingerprint mismatch blocks POST replay", async () => {
    const store = createMemoryClientSaveOperationIntentStore();
    const post = vi.fn(async () => {
      throw new Error("timeout");
    });
    const injected: JournalCreateSaveOrchestratorDeps = {
      bootstrap: async () => ({ status: "ready", store }),
      capability: async () => ({ kind: "enabled" }),
      post,
      lookup: async () => new Response(JSON.stringify({ state: "not_found" })),
    };
    const initial = await runJournalCreateSave({ viewerEmail: "person@example.com", payload }, injected);
    if (initial.kind !== "pending") throw new Error("expected pending");
    await store.update({
      ...initial.intent,
      requestFingerprint: "tampered-fingerprint",
    });
    const recovered = await recoverJournalCreateSaves({ viewerEmail: "person@example.com" }, injected);
    expect(recovered[0]).toMatchObject({
      kind: "recovery_required",
      reason: "fingerprint_mismatch",
    });
    expect(post).toHaveBeenCalledTimes(1);
  });

  it("profile change after crash still POSTs the stored profileId", async () => {
    const store = createMemoryClientSaveOperationIntentStore();
    const post = vi
      .fn()
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValueOnce(new Response(JSON.stringify({ entry: { id: "entry_profile" } }), { status: 200 }));
    const injected: JournalCreateSaveOrchestratorDeps = {
      bootstrap: async () => ({ status: "ready", store }),
      capability: async () => ({ kind: "enabled" }),
      post,
      lookup: async () => new Response(JSON.stringify({ state: "not_found" })),
    };
    const initial = await runJournalCreateSave(
      { viewerEmail: "person@example.com", payload: { ...payload, profileId: "profile_1" } },
      injected,
    );
    if (initial.kind !== "pending") throw new Error("expected pending");
    const recovered = await recoverJournalCreateSaves(
      { viewerEmail: "person@example.com" },
      injected,
    );
    expect(recovered[0]?.kind).toBe("completed");
    expect(postedBody(post, 1).profileId).toBe("profile_1");
    expect(postedBody(post, 1).profileId).not.toBe("profile_ui_active");
  });

  it("photo payload restart replay uses stored photoDataUrl", async () => {
    const store = createMemoryClientSaveOperationIntentStore();
    const photoPayload = {
      ...payload,
      photoDataUrl: "data:image/png;base64,AAA",
    };
    const post = vi
      .fn()
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValueOnce(new Response(JSON.stringify({ entry: { id: "entry_photo" } }), { status: 200 }));
    const injected: JournalCreateSaveOrchestratorDeps = {
      bootstrap: async () => ({ status: "ready", store }),
      capability: async () => ({ kind: "enabled" }),
      post,
      lookup: async () => new Response(JSON.stringify({ state: "not_found" })),
    };
    const initial = await runJournalCreateSave({ viewerEmail: "person@example.com", payload: photoPayload }, injected);
    if (initial.kind !== "pending") throw new Error("expected pending");
    await recoverJournalCreateSaves({ viewerEmail: "person@example.com" }, injected);
    expect(postedBody(post, 1).photoDataUrl).toBe("data:image/png;base64,AAA");
    expect(post).toHaveBeenCalledTimes(2);
  });

  it("capability OFF after protocol start never falls back to legacy", async () => {
    const store = createMemoryClientSaveOperationIntentStore();
    const post = vi
      .fn()
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValueOnce(new Response(JSON.stringify({ entry: { id: "entry_cap_off" } }), { status: 200 }));
    const initial = await runJournalCreateSave(
      { viewerEmail: "person@example.com", payload },
      {
        bootstrap: async () => ({ status: "ready", store }),
        capability: async () => ({ kind: "enabled" }),
        post,
        lookup: async () => new Response(JSON.stringify({ state: "not_found" })),
      },
    );
    if (initial.kind !== "pending") throw new Error("expected pending");
    const recovered = await recoverJournalCreateSaves(
      { viewerEmail: "person@example.com" },
      {
        bootstrap: async () => ({ status: "ready", store }),
        capability: async () => ({ kind: "disabled" }),
        post,
        lookup: async () => new Response(JSON.stringify({ state: "not_found" })),
      },
    );
    expect(recovered[0]?.kind).toBe("completed");
    expect(post).toHaveBeenCalledTimes(2);
    expect(postedBody(post, 0).saveOperationId).toBe(initial.intent.saveOperationId);
    expect(postedBody(post, 1).saveOperationId).toBe(initial.intent.saveOperationId);
  });

  it("does not duplicate simulated journal save or donguri charge across exact replay", async () => {
    const simulated = createSimulatedJournalServer();
    const store = createMemoryClientSaveOperationIntentStore();
    const injected: JournalCreateSaveOrchestratorDeps = {
      bootstrap: async () => ({ status: "ready", store }),
      capability: async () => ({ kind: "enabled" }),
      post: simulated.post,
      lookup: async () => new Response(JSON.stringify({ state: "not_found" })),
    };
    const first = await runJournalCreateSave({ viewerEmail: "person@example.com", payload }, injected);
    expect(first.kind).toBe("completed");
    const recovered = await recoverJournalCreateSaves(
      { viewerEmail: "person@example.com" },
      {
        ...injected,
        lookup: simulated.lookup,
      },
    );
    expect(recovered).toEqual([]);
    expect(simulated.post).toHaveBeenCalledTimes(1);
    expect(simulated.entries.size).toBe(1);
    expect([...simulated.charges.values()]).toEqual([1]);
  });

  it("replays stored payload on explicit continue without rebuilding from caller fields", async () => {
    const store = createMemoryClientSaveOperationIntentStore();
    const post = vi
      .fn()
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValueOnce(new Response(JSON.stringify({ entry: { id: "entry_replayed" } }), { status: 200 }));
    const injected: JournalCreateSaveOrchestratorDeps = {
      bootstrap: async () => ({ status: "ready", store }),
      capability: async () => ({ kind: "enabled" }),
      post,
      lookup: async () => new Response(JSON.stringify({ state: "not_found" })),
    };
    const initial = await runJournalCreateSave({ viewerEmail: "person@example.com", payload }, injected);
    expect(initial.kind).toBe("pending");
    if (initial.kind !== "pending") return;
    const mutated: JournalCreatePayload = {
      ...payload,
      content: "caller reconstructed body",
      profileId: "profile_ui_active",
    };
    const resumed = await continueJournalCreateSaveRecovery(
      {
        viewerEmail: "person@example.com",
        saveOperationId: initial.intent.saveOperationId,
        payload: mutated,
      },
      injected,
    );
    expect(resumed).toMatchObject({ kind: "completed", entryId: "entry_replayed" });
    expect(postedBody(post, 1)).toMatchObject({
      saveOperationId: initial.intent.saveOperationId,
      content: "canonical body",
      profileId: "profile_1",
    });
  });

  it("one recovery cycle posts at most once even with duplicate continue", async () => {
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
    if (initial.kind !== "processing") throw new Error("expected processing intent");
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
