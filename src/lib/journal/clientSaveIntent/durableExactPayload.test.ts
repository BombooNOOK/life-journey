import { describe, expect, it } from "vitest";

import { createMemoryClientSaveOperationIntentStore } from "@/lib/journal/clientSaveIntent/memoryStore";
import { canonicalizeExactJournalSavePayload } from "@/lib/journal/clientSaveIntent/exactPayloadCanonical";
import type { ClientSaveOperationIntent } from "@/lib/journal/clientSaveIntent/types";
import { createNativeClientSaveOperationIntentStore } from "@/lib/journal/clientSaveIntent/NativeClientSaveOperationIntentStore";
import { Capacitor } from "@capacitor/core";

const OP = "jso_1234567890abcdefghijklmnopqrstuv";
const OP2 = "jso_abcdefghijklmnopqrstuv1234567890";

const payload = {
  content: "森にあしあと",
  entryDate: "2026-08-18",
  profileId: "profile_fixed_1",
  mood: "calm",
  activity: "record_anyway",
  companionType: "owl",
  designTheme: "simple",
  contentFontMode: "standard",
  includeInBook: true,
};

const photoPayload = {
  ...payload,
  photoDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
};

function preparedIntent(
  saveOperationId: string,
  requestFingerprint: string,
): ClientSaveOperationIntent {
  const now = "2026-08-18T04:00:00.000Z";
  return {
    intentId: "intent_ai71_test",
    saveOperationId,
    actorKey: "operator@ljd.invalid",
    stableActorKey: null,
    draftRef: null,
    requestFingerprint,
    status: "prepared",
    serverEntryId: null,
    failureCode: null,
    createdAt: now,
    updatedAt: now,
    lastAttemptAt: null,
    completedAt: null,
  };
}

describe("AI-7.1 durable exact payload store", () => {
  it("inserts and loads a text-only payload with exact JSON match", async () => {
    const store = createMemoryClientSaveOperationIntentStore();
    const canonical = canonicalizeExactJournalSavePayload({
      saveOperationId: OP,
      payload,
    });
    expect(canonical.ok).toBe(true);
    if (!canonical.ok) return;
    const persisted = await store.persistPreparedIntentWithExactPayload({
      intent: preparedIntent(OP, canonical.requestFingerprint),
      payload,
    });
    expect(persisted.kind).toBe("created");
    if (persisted.kind !== "created") return;
    expect(persisted.payload.requestJson).toBe(canonical.requestJson);
    const loaded = await store.loadExactPayloadBySaveOperationId(OP);
    expect(loaded.kind).toBe("ok");
    if (loaded.kind !== "ok") return;
    expect(loaded.payload.requestJson).toBe(canonical.requestJson);
    expect(loaded.request.profileId).toBe("profile_fixed_1");
    expect(loaded.request.designTheme).toBe("simple_plain");
  });

  it("inserts and loads a photo payload without adding extra keys", async () => {
    const store = createMemoryClientSaveOperationIntentStore();
    const canonical = canonicalizeExactJournalSavePayload({
      saveOperationId: OP,
      payload: photoPayload,
    });
    expect(canonical.ok).toBe(true);
    if (!canonical.ok) return;
    const persisted = await store.persistPreparedIntentWithExactPayload({
      intent: preparedIntent(OP, canonical.requestFingerprint),
      payload: photoPayload,
    });
    expect(persisted.kind).toBe("created");
    if (persisted.kind !== "created") return;
    const parsed = JSON.parse(persisted.payload.requestJson) as Record<string, unknown>;
    expect(parsed.photoDataUrl).toBe(photoPayload.photoDataUrl);
    expect(parsed).not.toHaveProperty("photoRemoved");
    const loaded = await store.loadExactPayloadBySaveOperationId(OP);
    expect(loaded.kind).toBe("ok");
    if (loaded.kind !== "ok") return;
    expect(loaded.payload.requestJson).toBe(persisted.payload.requestJson);
  });

  it("treats the same operation + same payload as already_exists", async () => {
    const store = createMemoryClientSaveOperationIntentStore();
    const canonical = canonicalizeExactJournalSavePayload({
      saveOperationId: OP,
      payload,
    });
    if (!canonical.ok) return;
    const first = await store.persistPreparedIntentWithExactPayload({
      intent: preparedIntent(OP, canonical.requestFingerprint),
      payload,
    });
    const second = await store.persistPreparedIntentWithExactPayload({
      intent: preparedIntent(OP, canonical.requestFingerprint),
      payload,
    });
    expect(first.kind).toBe("created");
    expect(second.kind).toBe("already_exists");
  });

  it("rejects a different payload for the same saveOperationId", async () => {
    const store = createMemoryClientSaveOperationIntentStore();
    const canonical = canonicalizeExactJournalSavePayload({
      saveOperationId: OP,
      payload,
    });
    if (!canonical.ok) return;
    await store.persistPreparedIntentWithExactPayload({
      intent: preparedIntent(OP, canonical.requestFingerprint),
      payload,
    });
    const other = canonicalizeExactJournalSavePayload({
      saveOperationId: OP,
      payload: { ...payload, content: "別の本文" },
    });
    if (!other.ok) return;
    const conflict = await store.persistPreparedIntentWithExactPayload({
      intent: preparedIntent(OP, other.requestFingerprint),
      payload: { ...payload, content: "別の本文" },
    });
    expect(conflict.kind).toBe("payload_conflict");
    const loaded = await store.loadExactPayloadBySaveOperationId(OP);
    expect(loaded.kind).toBe("ok");
    if (loaded.kind !== "ok") return;
    expect(loaded.request.content).toBe("森にあしあと");
  });

  it("rolls back intent+payload when payload insert fails", async () => {
    const store = createMemoryClientSaveOperationIntentStore({
      failPayloadInsert: true,
    });
    const canonical = canonicalizeExactJournalSavePayload({
      saveOperationId: OP,
      payload,
    });
    if (!canonical.ok) return;
    await expect(
      store.persistPreparedIntentWithExactPayload({
        intent: preparedIntent(OP, canonical.requestFingerprint),
        payload,
      }),
    ).rejects.toThrow("payload_insert_forced_failure");
    expect(await store.findByActorAndSaveOperationId("operator@ljd.invalid", OP)).toBeNull();
    expect(await store.loadExactPayloadBySaveOperationId(OP)).toEqual({ kind: "missing" });
  });

  it("keeps metadata-only intents payload-unavailable", async () => {
    const store = createMemoryClientSaveOperationIntentStore();
    const canonical = canonicalizeExactJournalSavePayload({
      saveOperationId: OP,
      payload,
    });
    if (!canonical.ok) return;
    await store.tryInsert(preparedIntent(OP, canonical.requestFingerprint));
    expect(await store.loadExactPayloadBySaveOperationId(OP)).toEqual({ kind: "missing" });
    const attempt = await store.persistPreparedIntentWithExactPayload({
      intent: preparedIntent(OP, canonical.requestFingerprint),
      payload,
    });
    expect(attempt.kind).toBe("intent_without_payload");
  });

  it("survives a store reopen from the same durable snapshot", async () => {
    const backing = {
      rows: new Map(),
      payloads: new Map(),
      tombstones: new Map(),
    };
    const first = createMemoryClientSaveOperationIntentStore({ backing });
    const canonical = canonicalizeExactJournalSavePayload({
      saveOperationId: OP2,
      payload,
    });
    if (!canonical.ok) return;
    await first.persistPreparedIntentWithExactPayload({
      intent: { ...preparedIntent(OP2, canonical.requestFingerprint), intentId: "intent_reopen" },
      payload,
    });
    const reopened = createMemoryClientSaveOperationIntentStore({
      backing: {
        rows: new Map(backing.rows),
        payloads: new Map(backing.payloads),
        tombstones: new Map(backing.tombstones),
      },
    });
    const loaded = await reopened.loadExactPayloadBySaveOperationId(OP2);
    expect(loaded.kind).toBe("ok");
    if (loaded.kind !== "ok") return;
    expect(loaded.payload.requestJson).toBe(canonical.requestJson);
    expect(loaded.payload.requestFingerprint).toBe(canonical.requestFingerprint);
  });

  it("fail-closes when SQLCipher/native store is unavailable", () => {
    expect(Capacitor.isNativePlatform()).toBe(false);
    expect(() => createNativeClientSaveOperationIntentStore()).toThrow(/native_only|browser fallback/);
  });
});
