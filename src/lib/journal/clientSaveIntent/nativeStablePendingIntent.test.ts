import { afterEach, describe, expect, it, vi } from "vitest";

import { buildFirebaseActorKey } from "@/lib/auth/firebaseActorKey";
import {
  clearCurrentSessionJournalCreatePayloadsForTest,
  continueJournalCreateSaveRecovery,
  recoverJournalCreateSaves,
  runJournalCreateSave,
  type JournalCreatePayload,
  type JournalCreateSaveOrchestratorDeps,
} from "@/lib/journal/clientSaveIntent/JournalCreateSaveOrchestrator";
import { createMemoryClientSaveOperationIntentStore } from "@/lib/journal/clientSaveIntent/memoryStore";
import { NATIVE_STABLE_PENDING_INTENT_FLAG } from "@/lib/journal/clientSaveIntent/nativeStablePendingIntentGate";
import {
  ensureClientSaveIntentSchema,
  CREATE_INTENT_SQL,
} from "@/lib/journal/clientSaveIntent/clientSaveIntentSqlStore";
import type { ClientSaveDurableStore } from "@/lib/journal/clientSaveIntent/types";

const payload: JournalCreatePayload = {
  content: "stable body",
  mood: "calm",
  activity: "record_anyway",
  companionType: "owl",
  designTheme: "simple_plain",
  contentFontMode: "standard",
  entryDate: "2026-08-28",
  profileId: "profile_1",
  includeInBook: true,
};

const UID_A = "UID-A-STABLE-TEST";
const UID_B = "UID-B-STABLE-TEST";
const EMAIL_A = "email-a@example.com";
const EMAIL_B = "email-b@example.com";
const EMAIL_X = "shared@example.com";

function withStableFlag(enabled: boolean) {
  if (enabled) {
    vi.stubEnv(NATIVE_STABLE_PENDING_INTENT_FLAG, "YES");
  } else {
    vi.unstubAllEnvs();
  }
}

function deps(overrides: Partial<JournalCreateSaveOrchestratorDeps> = {}) {
  const store = createMemoryClientSaveOperationIntentStore();
  const post = vi.fn(async () =>
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

afterEach(() => {
  vi.unstubAllEnvs();
  clearCurrentSessionJournalCreatePayloadsForTest();
});

describe("AI-X6.6A native stable pending intent", () => {
  it("A: flag OFF keeps legacy actorKey parity without Firebase UID", async () => {
    withStableFlag(false);
    const { post, deps: d } = deps();
    const result = await runJournalCreateSave(
      { viewerEmail: EMAIL_A, payload },
      d,
    );
    expect(result.kind).toBe("completed");
    expect(post).toHaveBeenCalledTimes(1);
    if (result.kind === "completed" && result.intent) {
      expect(result.intent.actorKey).toBe(EMAIL_A);
      expect(result.intent.stableActorKey).toBeNull();
    }
  });

  it("B: stable new intent persists firebase:<UID> when gate ON", async () => {
    withStableFlag(true);
    const { deps: d } = deps();
    const result = await runJournalCreateSave(
      { viewerEmail: EMAIL_A, firebaseUid: UID_A, payload },
      d,
    );
    expect(result.kind).toBe("completed");
    if (result.kind === "completed" && result.intent) {
      expect(result.intent.stableActorKey).toBe(buildFirebaseActorKey(UID_A));
      expect(result.intent.actorKey).toBe(EMAIL_A);
    }
  });

  it("stable gate ON fails closed without Firebase UID", async () => {
    withStableFlag(true);
    const { post, deps: d } = deps();
    const result = await runJournalCreateSave({ viewerEmail: EMAIL_A, payload }, d);
    expect(result).toMatchObject({ kind: "protocol_start_failed", reason: "stable_identity_unavailable" });
    expect(post).not.toHaveBeenCalled();
  });

  it("C: same UID email change preserves saveOperationId and exact payload on recovery", async () => {
    withStableFlag(true);
    const { store, deps: d } = deps({
      post: vi.fn(async () => {
        throw new Error("network_down");
      }),
      lookup: async () => new Response(JSON.stringify({ state: "not_found" }), { status: 200 }),
    });
    const created = await runJournalCreateSave(
      { viewerEmail: EMAIL_A, firebaseUid: UID_A, payload },
      d,
    );
    expect(created.kind).toBe("pending");
    if (created.kind !== "pending") throw new Error("expected pending");
    const saveOperationId = created.intent.saveOperationId;
    const stableKey = buildFirebaseActorKey(UID_A);

    const replayPost = vi.fn(async (json: string) => {
      const body = JSON.parse(json) as Record<string, unknown>;
      expect(body.saveOperationId).toBe(saveOperationId);
      return new Response(JSON.stringify({ entry: { id: "entry_replay" } }), { status: 200 });
    });
    const recovered = await recoverJournalCreateSaves(
      { viewerEmail: EMAIL_B, firebaseUid: UID_A },
      { ...d, postExactJson: replayPost },
    );
    expect(recovered.some((r) => r.kind === "completed")).toBe(true);
    expect(replayPost).toHaveBeenCalledTimes(1);
    const row = await store.findByStableActorAndSaveOperationId(stableKey, saveOperationId);
    expect(row?.stableActorKey).toBe(stableKey);
    expect(row?.actorKey).toBe(EMAIL_A);
  });

  it("D: email reuse cannot replay another UID stable pending intent", async () => {
    withStableFlag(true);
    const { store, deps: d } = deps({
      post: vi.fn(async () => {
        throw new Error("network_down");
      }),
    });
    const created = await runJournalCreateSave(
      { viewerEmail: EMAIL_X, firebaseUid: UID_A, payload },
      d,
    );
    expect(created.kind).toBe("pending");
    if (created.kind !== "pending") throw new Error("expected pending");

    const recovered = await recoverJournalCreateSaves(
      { viewerEmail: EMAIL_X, firebaseUid: UID_B },
      d,
    );
    expect(recovered).toEqual([]);
    const byStable = await store.findByStableActorAndSaveOperationId(
      buildFirebaseActorKey(UID_B),
      created.intent.saveOperationId,
    );
    expect(byStable).toBeNull();
  });

  it("E: auth mismatch fails closed and retains pending row", async () => {
    withStableFlag(true);
    const { store, deps: d } = deps({
      post: vi.fn(async () => {
        throw new Error("network_down");
      }),
    });
    const created = await runJournalCreateSave(
      { viewerEmail: EMAIL_A, firebaseUid: UID_A, payload },
      d,
    );
    if (created.kind !== "pending") throw new Error("expected pending");

    const result = await continueJournalCreateSaveRecovery(
      {
        viewerEmail: EMAIL_A,
        firebaseUid: UID_B,
        saveOperationId: created.intent.saveOperationId,
      },
      d,
    );
    expect(result).toMatchObject({
      kind: "recovery_required",
      reason: "stable_auth_mismatch",
    });
    const row = await store.findByStableActorAndSaveOperationId(
      buildFirebaseActorKey(UID_A),
      created.intent.saveOperationId,
    );
    expect(row?.status).toBe("awaiting_result");
  });

  it("F: legacy row with NULL stableActorKey remains recoverable by email actorKey", async () => {
    withStableFlag(false);
    const { store, deps: d } = deps({
      post: vi.fn(async () => {
        throw new Error("network_down");
      }),
    });
    const created = await runJournalCreateSave({ viewerEmail: EMAIL_A, payload }, d);
    if (created.kind !== "pending") throw new Error("expected pending");
    expect(created.intent.stableActorKey).toBeNull();
    const recovered = await recoverJournalCreateSaves({ viewerEmail: EMAIL_A }, d);
    expect(recovered.length).toBeGreaterThan(0);
  });

  it("G: restart preserves stable actor, saveOperationId, and payload in backing store", async () => {
    withStableFlag(true);
    const backing = {
      rows: new Map(),
      payloads: new Map(),
      tombstones: new Map(),
    };
    const store = createMemoryClientSaveOperationIntentStore({ backing });
    const created = await runJournalCreateSave(
      { viewerEmail: EMAIL_A, firebaseUid: UID_A, payload },
      {
        bootstrap: async () => ({ status: "ready", store }),
        capability: async () => ({ kind: "enabled" }),
        post: async () => new Response(JSON.stringify({ entry: { id: "e1" } }), { status: 200 }),
        lookup: async () => new Response(JSON.stringify({ state: "processing" }), { status: 200 }),
      },
    );
    if (created.kind !== "completed" || !created.intent) throw new Error("expected completed");
    const reopened = createMemoryClientSaveOperationIntentStore({ backing });
    const row = await reopened.findByStableActorAndSaveOperationId(
      buildFirebaseActorKey(UID_A),
      created.intent.saveOperationId,
    );
    expect(row?.stableActorKey).toBe(buildFirebaseActorKey(UID_A));
    expect(row?.saveOperationId).toBe(created.intent.saveOperationId);
  });

  it("H: completed cleanup still removes exact payload for stable intents", async () => {
    withStableFlag(true);
    const { store, deps: d } = deps();
    const order: string[] = [];
    const wrapped: ClientSaveDurableStore = {
      ...store,
      deleteExactPayloadBySaveOperationId: async (input) => {
        order.push("cleanup");
        return store.deleteExactPayloadBySaveOperationId(input);
      },
    };
    const created = await runJournalCreateSave(
      { viewerEmail: EMAIL_A, firebaseUid: UID_A, payload },
      {
        ...d,
        bootstrap: async () => ({ status: "ready", store: wrapped }),
      },
    );
    expect(created.kind).toBe("completed");
    expect(order).toContain("cleanup");
  });

  it("I: network failure before response leaves stable pending for replay", async () => {
    withStableFlag(true);
    const { store, deps: d } = deps({
      post: vi.fn(async () => {
        throw new Error("network_down");
      }),
    });
    const result = await runJournalCreateSave(
      { viewerEmail: EMAIL_A, firebaseUid: UID_A, payload },
      d,
    );
    expect(result.kind).toBe("pending");
    if (result.kind !== "pending") return;
    const loaded = await store.loadExactPayloadBySaveOperationId(result.intent.saveOperationId);
    expect(loaded.kind).toBe("ok");
    expect(result.intent.stableActorKey).toBe(buildFirebaseActorKey(UID_A));
  });

  it("J: persist-before-POST invariant holds for stable mode", async () => {
    withStableFlag(true);
    const store = createMemoryClientSaveOperationIntentStore();
    const order: string[] = [];
    const wrapped: ClientSaveDurableStore = {
      ...store,
      persistPreparedIntentWithExactPayload: async (input) => {
        order.push("persist");
        return store.persistPreparedIntentWithExactPayload(input);
      },
    };
    const post = vi.fn(async () => {
      order.push("post");
      return new Response(JSON.stringify({ entry: { id: "entry_1" } }), { status: 200 });
    });
    await runJournalCreateSave(
      { viewerEmail: EMAIL_A, firebaseUid: UID_A, payload },
      {
        bootstrap: async () => ({ status: "ready", store: wrapped }),
        capability: async () => ({ kind: "enabled" }),
        post,
        lookup: async () => new Response(JSON.stringify({ state: "not_found" }), { status: 200 }),
      },
    );
    expect(order).toEqual(["persist", "post"]);
  });

  it("schema v3 migrates additively to stable_actor_key without destructive SQL", async () => {
    const execute = vi.fn(async () => undefined);
    const query = vi.fn(async (sql: string) => {
      if (sql === "PRAGMA user_version") return { values: [{ user_version: 3 }] };
      if (sql === "PRAGMA table_info(client_save_operation_intent)") {
        return {
          values: [
            "intent_id", "save_operation_id", "actor_key", "stable_actor_key", "draft_ref",
            "request_fingerprint", "status", "server_entry_id", "failure_code", "created_at",
            "updated_at", "last_attempt_at", "completed_at",
          ].map((name) => ({ name })),
        };
      }
      if (sql === "PRAGMA table_info(client_save_operation_payload)") {
        return {
          values: [
            "save_operation_id", "payload_version", "request_json", "request_fingerprint",
            "request_byte_length", "created_at",
          ].map((name) => ({ name })),
        };
      }
      throw new Error(`unexpected_query:${sql}`);
    });
    await ensureClientSaveIntentSchema({ query, execute });
    expect(execute).toHaveBeenCalledWith(
      "ALTER TABLE client_save_operation_intent ADD COLUMN stable_actor_key TEXT",
    );
    expect(execute).toHaveBeenCalledWith("PRAGMA user_version = 4");
    expect(execute.mock.calls.flat().join("\n")).not.toMatch(/\bDROP\b|\bDELETE\b/i);
  });

  it("fresh schema includes stable_actor_key column", () => {
    expect(CREATE_INTENT_SQL).toContain("stable_actor_key");
  });
});
