import { describe, expect, it } from "vitest";

import {
  beginAccountDeleteSaveIntentTeardown,
  isSaveIntentActivityBlockedForActor,
  resetAccountDeleteSaveIntentTeardownForTest,
  resumeAccountDeleteSaveIntentCleanup,
} from "@/lib/account/accountDeleteSaveIntentTeardown";
import { prepareClientSaveOperationIntent } from "@/lib/journal/clientSaveIntent/ClientSaveOperationIntentService";
import { createMemoryClientSaveOperationIntentStore } from "@/lib/journal/clientSaveIntent/memoryStore";
import { runJournalCreateSave } from "@/lib/journal/clientSaveIntent/JournalCreateSaveOrchestrator";

const actor = "person@example.com";
const other = "other@example.com";

async function seed(store: ReturnType<typeof createMemoryClientSaveOperationIntentStore>, email: string, id: string) {
  await prepareClientSaveOperationIntent(store, {
    viewerEmail: email,
    requestFingerprint: "v1|test",
    saveOperationId: id,
  });
}

describe("account delete native save-intent teardown", () => {
  it("deletes every target actor intent only after server success", async () => {
    resetAccountDeleteSaveIntentTeardownForTest();
    const store = createMemoryClientSaveOperationIntentStore();
    await seed(store, actor, "01HXSAVEOPERATIONID00000001");
    await seed(store, other, "01HXSAVEOPERATIONID00000002");
    const teardown = await beginAccountDeleteSaveIntentTeardown(actor, {
      bootstrap: async () => ({ status: "ready", store }),
    });
    expect(await store.getDeletionTombstone(actor)).not.toBeNull();
    expect(isSaveIntentActivityBlockedForActor(actor)).toBe(true);
    expect(await store.findByActorAndSaveOperationId(actor, "01HXSAVEOPERATIONID00000001")).not.toBeNull();
    await expect(teardown.serverDeleteSucceeded()).resolves.toEqual({ deletedIntentCount: 1 });
    expect(await store.findByActorAndSaveOperationId(actor, "01HXSAVEOPERATIONID00000001")).toBeNull();
    expect(await store.findByActorAndSaveOperationId(other, "01HXSAVEOPERATIONID00000002")).not.toBeNull();
    expect(await store.getDeletionTombstone(actor)).toBeNull();
    expect(isSaveIntentActivityBlockedForActor(actor)).toBe(true);
  });

  it("keeps intents and releases save activity when server deletion fails", async () => {
    resetAccountDeleteSaveIntentTeardownForTest();
    const store = createMemoryClientSaveOperationIntentStore();
    await seed(store, actor, "01HXSAVEOPERATIONID00000001");
    const teardown = await beginAccountDeleteSaveIntentTeardown(actor, {
      bootstrap: async () => ({ status: "ready", store }),
    });
    await teardown.serverDeleteFailed();
    expect(await store.findByActorAndSaveOperationId(actor, "01HXSAVEOPERATIONID00000001")).not.toBeNull();
    expect(isSaveIntentActivityBlockedForActor(actor)).toBe(false);
    expect(await store.getDeletionTombstone(actor)).toBeNull();
  });

  it("keeps actor save activity suppressed when server success is followed by native cleanup failure", async () => {
    resetAccountDeleteSaveIntentTeardownForTest();
    const store = createMemoryClientSaveOperationIntentStore();
    await seed(store, actor, "01HXSAVEOPERATIONID00000001");
    const teardown = await beginAccountDeleteSaveIntentTeardown(actor, {
      bootstrap: async () => ({
        status: "ready",
        store: { ...store, deleteByActor: async () => { throw new Error("native_cleanup_failed"); } },
      }),
    });
    await expect(teardown.serverDeleteSucceeded()).rejects.toThrow("native_cleanup_failed");
    expect(isSaveIntentActivityBlockedForActor(actor)).toBe(true);
    expect(await store.findByActorAndSaveOperationId(actor, "01HXSAVEOPERATIONID00000001")).not.toBeNull();
  });

  it("keeps a durable tombstone across restart and retries only local cleanup", async () => {
    resetAccountDeleteSaveIntentTeardownForTest();
    const store = createMemoryClientSaveOperationIntentStore();
    await seed(store, actor, "01HXSAVEOPERATIONID00000001");
    const teardown = await beginAccountDeleteSaveIntentTeardown(actor, {
      bootstrap: async () => ({ status: "ready", store }),
    });
    await expect(
      teardown.serverDeleteSucceeded(),
    ).resolves.toEqual({ deletedIntentCount: 1 });
    // Recreate the failure fixture representing a server-success cleanup error
    // that left an intent + tombstone behind before process exit.
    await seed(store, actor, "01HXSAVEOPERATIONID00000003");
    await store.writeDeletionTombstone(actor, "2026-08-15T00:00:00.000Z");
    resetAccountDeleteSaveIntentTeardownForTest();
    const failingStore = { ...store, deleteByActor: async () => { throw new Error("still_unavailable"); } };
    expect(await resumeAccountDeleteSaveIntentCleanup(actor, failingStore)).toBe(true);
    expect(isSaveIntentActivityBlockedForActor(actor)).toBe(true);
    expect(await store.getDeletionTombstone(actor)).not.toBeNull();
    expect(await resumeAccountDeleteSaveIntentCleanup(actor, store)).toBe(false);
    expect(await store.findByActorAndSaveOperationId(actor, "01HXSAVEOPERATIONID00000003")).toBeNull();
    expect(await store.getDeletionTombstone(actor)).toBeNull();
  });

  it("blocks restarted Journal admission while durable cleanup is still failing", async () => {
    resetAccountDeleteSaveIntentTeardownForTest();
    const store = createMemoryClientSaveOperationIntentStore();
    await seed(store, actor, "01HXSAVEOPERATIONID00000001");
    await store.writeDeletionTombstone(actor, "2026-08-15T00:00:00.000Z");
    const failingStore = { ...store, deleteByActor: async () => { throw new Error("still_unavailable"); } };
    const result = await runJournalCreateSave(
      {
        viewerEmail: actor,
        payload: {
          content: "body", mood: "calm", activity: "record_anyway", companionType: "owl",
          designTheme: "simple_plain", contentFontMode: "standard", entryDate: "2026-08-15", profileId: "profile_1",
        },
      },
      {
        bootstrap: async () => ({ status: "ready", store: failingStore }),
        capability: async () => ({ kind: "disabled" }),
        post: async () => new Response(),
        lookup: async () => new Response(),
      },
    );
    expect(result).toMatchObject({ kind: "protocol_start_failed", reason: "account_delete_in_progress" });
  });

  it("allows browser deletion without native cleanup but blocks unavailable native storage", async () => {
    resetAccountDeleteSaveIntentTeardownForTest();
    const browser = await beginAccountDeleteSaveIntentTeardown(actor, {
      bootstrap: async () => ({ status: "unsupported_platform" }),
    });
    await expect(browser.serverDeleteSucceeded()).resolves.toEqual({ deletedIntentCount: 0 });
    resetAccountDeleteSaveIntentTeardownForTest();
    await expect(
      beginAccountDeleteSaveIntentTeardown(actor, {
        bootstrap: async () => ({ status: "secure_store_unavailable" }),
      }),
    ).rejects.toThrow("account_delete_secure_intent_store_unavailable");
  });

  it("blocks create/recovery activity while account deletion is in flight", async () => {
    resetAccountDeleteSaveIntentTeardownForTest();
    const store = createMemoryClientSaveOperationIntentStore();
    const teardown = await beginAccountDeleteSaveIntentTeardown(actor, {
      bootstrap: async () => ({ status: "ready", store }),
    });
    const post = async () => new Response(JSON.stringify({ entry: { id: "unexpected" } }));
    const result = await runJournalCreateSave(
      {
        viewerEmail: actor,
        payload: {
          content: "body",
          mood: "calm",
          activity: "record_anyway",
          companionType: "owl",
          designTheme: "simple_plain",
          contentFontMode: "standard",
          entryDate: "2026-08-15",
          profileId: "profile_1",
        },
      },
      {
        bootstrap: async () => ({ status: "ready", store }),
        capability: async () => ({ kind: "enabled" }),
        post,
        lookup: async () => new Response(),
      },
    );
    expect(result).toMatchObject({ kind: "protocol_start_failed", reason: "account_delete_in_progress" });
    await teardown.serverDeleteFailed();
  });
});
