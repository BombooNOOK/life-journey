import { describe, expect, it, vi } from "vitest";

import { runJournalCreateSave, type JournalCreateSaveOrchestratorDeps } from "@/lib/journal/clientSaveIntent/JournalCreateSaveOrchestrator";
import { createMemoryClientSaveOperationIntentStore } from "@/lib/journal/clientSaveIntent/memoryStore";

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
});
