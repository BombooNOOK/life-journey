import { randomBytes } from "node:crypto";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { canonicalizeExactJournalSavePayload } from "@/lib/journal/clientSaveIntent/exactPayloadCanonical";
import {
  createEncryptedFileClientSaveDurableStore,
  unlinkEncryptedIntentContainer,
} from "@/lib/journal/clientSaveIntent/encryptedFileSqliteSession";
import {
  clearCurrentSessionJournalCreatePayloadsForTest,
  recoverJournalCreateSaves,
  runJournalCreateSave,
  type JournalCreatePayload,
  type JournalCreateSaveOrchestratorDeps,
} from "@/lib/journal/clientSaveIntent/JournalCreateSaveOrchestrator";
import type { ClientSaveDurableStore, ClientSaveOperationIntent } from "@/lib/journal/clientSaveIntent/types";

const ACTOR = "operator@ljd.invalid";
const PASSPHRASE = "ai73-test-only-passphrase";

const textPayload = {
  content: "森にあしあと",
  entryDate: "2026-08-18",
  profileId: "profile_fixed_1",
  mood: "calm",
  activity: "record_anyway",
  companionType: "owl",
  designTheme: "simple_plain",
  contentFontMode: "standard",
  includeInBook: true,
};

const photoPayload = {
  ...textPayload,
  photoDataUrl:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
};

const journalPayload: JournalCreatePayload = {
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

const tempFiles: string[] = [];

function preparedIntent(
  saveOperationId: string,
  requestFingerprint: string,
  status: ClientSaveOperationIntent["status"] = "prepared",
): ClientSaveOperationIntent {
  const now = "2026-08-18T05:00:00.000Z";
  return {
    intentId: `intent_${saveOperationId.slice(-12)}`,
    saveOperationId,
    actorKey: ACTOR,
    draftRef: null,
    requestFingerprint,
    status,
    serverEntryId: null,
    failureCode: null,
    createdAt: now,
    updatedAt: now,
    lastAttemptAt: null,
    completedAt: null,
  };
}

async function newEncryptedStore() {
  const dir = await mkdtemp(join(tmpdir(), "ljd-ai73-"));
  const encryptedPath = join(dir, "intent.enc");
  tempFiles.push(encryptedPath);
  const store = createEncryptedFileClientSaveDurableStore({
    encryptedPath,
    passphrase: PASSPHRASE,
  });
  return { store, encryptedPath };
}

function reopen(encryptedPath: string): ClientSaveDurableStore {
  return createEncryptedFileClientSaveDurableStore({
    encryptedPath,
    passphrase: PASSPHRASE,
  });
}

afterEach(async () => {
  clearCurrentSessionJournalCreatePayloadsForTest();
  await Promise.all(tempFiles.splice(0).map((path) => unlinkEncryptedIntentContainer(path)));
});

describe("AI-7.3 native-compatible encrypted payload durability", () => {
  it("reopens text payload exactly after close and instance discard", async () => {
    const op = `jso_${randomBytes(16).toString("base64url")}`;
    const { store, encryptedPath } = await newEncryptedStore();
    const canonical = canonicalizeExactJournalSavePayload({ saveOperationId: op, payload: textPayload });
    expect(canonical.ok).toBe(true);
    if (!canonical.ok) return;
    const persisted = await store.persistPreparedIntentWithExactPayload({
      intent: preparedIntent(op, canonical.requestFingerprint),
      payload: textPayload,
    });
    expect(persisted.kind).toBe("created");
    const closed = store;
    expect(closed).toBeTruthy();
    const reopened = reopen(encryptedPath);
    const loaded = await reopened.loadExactPayloadBySaveOperationId(op);
    expect(loaded.kind).toBe("ok");
    if (loaded.kind !== "ok") return;
    expect(loaded.payload.requestJson).toBe(canonical.requestJson);
    expect(loaded.payload.requestFingerprint).toBe(canonical.requestFingerprint);
    expect(loaded.request.saveOperationId).toBe(op);
    const intent = await reopened.findByActorAndSaveOperationId(ACTOR, op);
    expect(intent?.saveOperationId).toBe(op);
    const container = await readFile(encryptedPath);
    expect(container.includes(Buffer.from("森にあしあと"))).toBe(false);
    expect(container.subarray(0, 6).toString()).toBe("LJDCS1");
  });

  it("reopens photo payload exactly without rereading a file path", async () => {
    const op = `jso_${randomBytes(16).toString("base64url")}`;
    const { store, encryptedPath } = await newEncryptedStore();
    const canonical = canonicalizeExactJournalSavePayload({
      saveOperationId: op,
      payload: photoPayload,
    });
    if (!canonical.ok) return;
    await store.persistPreparedIntentWithExactPayload({
      intent: preparedIntent(op, canonical.requestFingerprint),
      payload: photoPayload,
    });
    const loaded = await reopen(encryptedPath).loadExactPayloadBySaveOperationId(op);
    expect(loaded.kind).toBe("ok");
    if (loaded.kind !== "ok") return;
    expect(loaded.payload.requestJson).toBe(canonical.requestJson);
    expect(loaded.request.photoDataUrl).toBe(photoPayload.photoDataUrl);
  });

  it("rejects a wrong passphrase on reopen", async () => {
    const op = `jso_${randomBytes(16).toString("base64url")}`;
    const { store, encryptedPath } = await newEncryptedStore();
    const canonical = canonicalizeExactJournalSavePayload({ saveOperationId: op, payload: textPayload });
    if (!canonical.ok) return;
    await store.persistPreparedIntentWithExactPayload({
      intent: preparedIntent(op, canonical.requestFingerprint),
      payload: textPayload,
    });
    const other = createEncryptedFileClientSaveDurableStore({
      encryptedPath,
      passphrase: "wrong-passphrase",
    });
    await expect(other.loadExactPayloadBySaveOperationId(op)).rejects.toThrow(
      /encrypted_intent_db_passphrase_mismatch/,
    );
  });
});

describe("AI-7.3 payload lifecycle cleanup", () => {
  async function persistAwaiting(store: ClientSaveDurableStore, op: string, payload = textPayload) {
    const canonical = canonicalizeExactJournalSavePayload({ saveOperationId: op, payload });
    if (!canonical.ok) throw new Error("canonical_failed");
    const created = await store.persistPreparedIntentWithExactPayload({
      intent: preparedIntent(op, canonical.requestFingerprint),
      payload,
    });
    if (created.kind !== "created") throw new Error(created.kind);
    return store.update({
      ...created.intent,
      status: "awaiting_result",
      lastAttemptAt: created.intent.createdAt,
      updatedAt: created.intent.createdAt,
    });
  }

  it("blocks payload cleanup while pending / awaiting_result", async () => {
    const op = `jso_${randomBytes(16).toString("base64url")}`;
    const { store } = await newEncryptedStore();
    const intent = await persistAwaiting(store, op);
    const blocked = await store.deleteExactPayloadBySaveOperationId({
      actorKey: ACTOR,
      saveOperationId: intent.saveOperationId,
    });
    expect(blocked).toMatchObject({ kind: "blocked", reason: "intent_not_completed" });
    expect(await store.loadExactPayloadBySaveOperationId(op)).toMatchObject({ kind: "ok" });
  });

  it("blocks payload cleanup while processing (awaiting_result after 202)", async () => {
    const op = `jso_${randomBytes(16).toString("base64url")}`;
    const { store } = await newEncryptedStore();
    const intent = await persistAwaiting(store, op);
    expect(intent.status).toBe("awaiting_result");
    const blocked = await store.deleteExactPayloadBySaveOperationId({
      actorKey: ACTOR,
      saveOperationId: op,
    });
    expect(blocked.kind).toBe("blocked");
    expect(await store.loadExactPayloadBySaveOperationId(op)).toMatchObject({ kind: "ok" });
  });

  it("blocks payload cleanup before local completed even if server_completed", async () => {
    const op = `jso_${randomBytes(16).toString("base64url")}`;
    const { store } = await newEncryptedStore();
    const awaiting = await persistAwaiting(store, op);
    const serverCompleted = await store.update({
      ...awaiting,
      status: "server_completed",
      serverEntryId: "entry_bound",
    });
    const blocked = await store.deleteExactPayloadBySaveOperationId({
      actorKey: ACTOR,
      saveOperationId: op,
    });
    expect(blocked).toMatchObject({ kind: "blocked", reason: "intent_not_completed" });
    expect(serverCompleted.status).toBe("server_completed");
    expect(await store.loadExactPayloadBySaveOperationId(op)).toMatchObject({ kind: "ok" });
  });

  it("does not delete payload for failed_final", async () => {
    const op = `jso_${randomBytes(16).toString("base64url")}`;
    const { store } = await newEncryptedStore();
    const awaiting = await persistAwaiting(store, op);
    await store.update({
      ...awaiting,
      status: "failed_final",
      failureCode: "SERVER_FAILED_FINAL",
      completedAt: awaiting.createdAt,
    });
    const blocked = await store.deleteExactPayloadBySaveOperationId({
      actorKey: ACTOR,
      saveOperationId: op,
    });
    expect(blocked).toMatchObject({ kind: "blocked", reason: "intent_not_completed" });
    expect(await store.loadExactPayloadBySaveOperationId(op)).toMatchObject({ kind: "ok" });
  });

  it("deletes only the payload row after local completed and keeps intent metadata", async () => {
    const op = `jso_${randomBytes(16).toString("base64url")}`;
    const { store, encryptedPath } = await newEncryptedStore();
    const awaiting = await persistAwaiting(store, op);
    const completed = await store.update({
      ...(await store.update({
        ...awaiting,
        status: "server_completed",
        serverEntryId: "entry_bound",
      })),
      status: "completed",
      completedAt: awaiting.createdAt,
    });
    const deleted = await store.deleteExactPayloadBySaveOperationId({
      actorKey: ACTOR,
      saveOperationId: op,
    });
    expect(deleted.kind).toBe("deleted");
    const reopened = reopen(encryptedPath);
    expect(await reopened.loadExactPayloadBySaveOperationId(op)).toEqual({ kind: "missing" });
    expect(await reopened.findByActorAndSaveOperationId(ACTOR, op)).toMatchObject({
      status: "completed",
      serverEntryId: "entry_bound",
      saveOperationId: op,
      requestFingerprint: completed.requestFingerprint,
    });
  });
});

describe("AI-7.3 crash boundaries and reopen recovery", () => {
  it("server_completed / local incomplete: restart lookup completes without replay", async () => {
    const { store, encryptedPath } = await newEncryptedStore();
    const post = vi.fn(async () => {
      throw new Error("timeout");
    });
    const injected: JournalCreateSaveOrchestratorDeps = {
      bootstrap: async () => ({ status: "ready", store }),
      capability: async () => ({ kind: "enabled" }),
      post,
      lookup: async () => new Response(JSON.stringify({ state: "not_found" })),
    };
    const initial = await runJournalCreateSave(
      { viewerEmail: ACTOR, payload: journalPayload },
      injected,
    );
    expect(initial.kind).toBe("pending");
    if (initial.kind !== "pending") return;
    const crashed = await store.update({
      ...initial.intent,
      status: "server_completed",
      serverEntryId: "entry_from_server",
    });
    expect(await store.loadExactPayloadBySaveOperationId(crashed.saveOperationId)).toMatchObject({
      kind: "ok",
    });
    const reopened = reopen(encryptedPath);
    const lookup = vi.fn(async () => new Response(JSON.stringify({ state: "completed", entryId: "entry_from_server" })));
    const recovered = await recoverJournalCreateSaves(
      { viewerEmail: ACTOR },
      {
        bootstrap: async () => ({ status: "ready", store: reopened }),
        capability: async () => ({ kind: "enabled" }),
        post,
        lookup,
      },
    );
    expect(lookup).not.toHaveBeenCalled();
    expect(post).toHaveBeenCalledTimes(1);
    expect(recovered[0]).toMatchObject({
      kind: "completed",
      entryId: "entry_from_server",
    });
    expect(
      await reopened.findByActorAndSaveOperationId(ACTOR, crashed.saveOperationId),
    ).toMatchObject({ status: "completed" });
    expect(await reopened.loadExactPayloadBySaveOperationId(crashed.saveOperationId)).toEqual({
      kind: "missing",
    });
  });

  it("local completed / payload remains: reopen does not replay, then maintenance cleanup", async () => {
    const { store, encryptedPath } = await newEncryptedStore();
    const failing: ClientSaveDurableStore = {
      ...store,
      deleteExactPayloadBySaveOperationId: async () => {
        throw new Error("cleanup_interrupted");
      },
    };
    const result = await runJournalCreateSave(
      { viewerEmail: ACTOR, payload: journalPayload },
      {
        bootstrap: async () => ({ status: "ready", store: failing }),
        capability: async () => ({ kind: "enabled" }),
        post: async () => new Response(JSON.stringify({ entry: { id: "entry_ok" } }), { status: 200 }),
        lookup: async () => new Response(),
      },
    );
    expect(result.kind).toBe("completed");
    if (result.kind !== "completed" || !result.intent) return;
    expect(await store.loadExactPayloadBySaveOperationId(result.intent.saveOperationId)).toMatchObject({
      kind: "ok",
    });
    const reopened = reopen(encryptedPath);
    const post = vi.fn(async () => new Response(JSON.stringify({}), { status: 202 }));
    const recovered = await recoverJournalCreateSaves(
      { viewerEmail: ACTOR },
      {
        bootstrap: async () => ({ status: "ready", store: reopened }),
        capability: async () => ({ kind: "enabled" }),
        post,
        lookup: async () => new Response(JSON.stringify({ state: "not_found" })),
      },
    );
    expect(recovered).toEqual([]);
    expect(post).not.toHaveBeenCalled();
    expect(
      await reopened.findByActorAndSaveOperationId(ACTOR, result.intent.saveOperationId),
    ).toMatchObject({ status: "completed", serverEntryId: "entry_ok" });
    expect(await reopened.loadExactPayloadBySaveOperationId(result.intent.saveOperationId)).toEqual({
      kind: "missing",
    });
  });
});
