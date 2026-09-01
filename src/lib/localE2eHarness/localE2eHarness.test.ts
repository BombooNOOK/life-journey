import { describe, expect, it, beforeEach } from "vitest";

import { createMemoryClientSaveOperationIntentStore } from "@/lib/journal/clientSaveIntent/memoryStore";
import {
  armLocalE2eFault,
  clearLocalE2eFaultsForTest,
  consumeLocalE2eFault,
  evaluateLocalE2eHarnessGate,
  wrapIntentStoreWithNativeCleanupFault,
  wrapJournalCreateDepsWithLocalE2eFaults,
} from "@/lib/localE2eHarness";
import type { JournalCreateSaveOrchestratorDeps } from "@/lib/journal/clientSaveIntent/JournalCreateSaveOrchestrator";

const ACTOR = "local-e2e-actor@ljd.local";
const OTHER = "other@example.com";
const LOCAL_DB = "postgresql://ljd:ljd_local_dev@127.0.0.1:5433/ljd_dev?schema=public";
const REMOTE_DB = "postgresql://u:p@ep-xxx.aws.neon.tech/neondb?sslmode=require";

describe("local E2E harness gates", () => {
  it("accepts only full local gate set", () => {
    const ok = evaluateLocalE2eHarnessGate({
      nodeEnv: "development",
      enableFlag: "YES",
      actorEmail: ACTOR,
      requestHost: "127.0.0.1:3000",
      databaseUrl: LOCAL_DB,
    });
    expect(ok.ok).toBe(true);
    expect(ok.actorEmail).toBe(ACTOR);
  });

  it("rejects production NODE_ENV", () => {
    expect(
      evaluateLocalE2eHarnessGate({
        nodeEnv: "production",
        enableFlag: "YES",
        actorEmail: ACTOR,
        requestHost: "127.0.0.1",
        databaseUrl: LOCAL_DB,
      }).reason,
    ).toBe("node_env_production");
  });

  it("rejects missing explicit flag", () => {
    expect(
      evaluateLocalE2eHarnessGate({
        nodeEnv: "development",
        enableFlag: "",
        actorEmail: ACTOR,
        requestHost: "127.0.0.1",
        databaseUrl: LOCAL_DB,
      }).reason,
    ).toBe("harness_flag_missing");
  });

  it("rejects remote / Production-like DB", () => {
    const gate = evaluateLocalE2eHarnessGate({
      nodeEnv: "development",
      enableFlag: "YES",
      actorEmail: ACTOR,
      requestHost: "127.0.0.1",
      databaseUrl: REMOTE_DB,
    });
    expect(gate.ok).toBe(false);
    expect(gate.reason).toContain("db_gate");
  });

  it("rejects non-loopback request host", () => {
    expect(
      evaluateLocalE2eHarnessGate({
        nodeEnv: "development",
        enableFlag: "YES",
        actorEmail: ACTOR,
        requestHost: "preview.vercel.app",
        databaseUrl: LOCAL_DB,
      }).reason,
    ).toBe("request_host_not_loopback");
  });
});

describe("local E2E one-shot faults", () => {
  beforeEach(() => {
    clearLocalE2eFaultsForTest();
  });

  it("wrong actor does not consume", () => {
    armLocalE2eFault({ mode: "lookup_processing_once", actorKey: ACTOR });
    expect(consumeLocalE2eFault("lookup_processing_once", OTHER)).toBe(false);
    expect(consumeLocalE2eFault("lookup_processing_once", ACTOR)).toBe(true);
    expect(consumeLocalE2eFault("lookup_processing_once", ACTOR)).toBe(false);
  });

  it("response-loss discards only after successful POST", async () => {
    armLocalE2eFault({ mode: "response_loss_after_server_success", actorKey: ACTOR });
    let posts = 0;
    const base: JournalCreateSaveOrchestratorDeps = {
      bootstrap: async () => ({ status: "unsupported_platform" }),
      capability: async () => ({ kind: "disabled" }),
      post: async () => {
        posts += 1;
        return new Response(JSON.stringify({ entry: { id: "e1" } }), { status: 200 });
      },
      lookup: async () => new Response("{}", { status: 200 }),
    };
    const wrapped = wrapJournalCreateDepsWithLocalE2eFaults(base, () => ACTOR);
    await expect(
      wrapped.post({
        content: "x",
        mood: "calm",
        activity: "a",
        companionType: "owl",
        designTheme: "simple_plain",
        contentFontMode: "standard",
        entryDate: "2026-08-15",
        profileId: "p1",
        saveOperationId: "op1",
      }),
    ).rejects.toThrow("local_e2e_response_loss_after_server_success");
    expect(posts).toBe(1);
    // Consumed — second call is formal.
    const second = await wrapped.post({
      content: "x",
      mood: "calm",
      activity: "a",
      companionType: "owl",
      designTheme: "simple_plain",
      contentFontMode: "standard",
      entryDate: "2026-08-15",
      profileId: "p1",
      saveOperationId: "op1",
    });
    expect(second.status).toBe(200);
    expect(posts).toBe(2);
  });

  it("lookup processing / not_found are one-shot and then formal", async () => {
    armLocalE2eFault({ mode: "lookup_processing_once", actorKey: ACTOR });
    armLocalE2eFault({ mode: "lookup_not_found_once", actorKey: ACTOR });
    let lookups = 0;
    const base: JournalCreateSaveOrchestratorDeps = {
      bootstrap: async () => ({ status: "unsupported_platform" }),
      capability: async () => ({ kind: "disabled" }),
      post: async () => new Response("{}", { status: 200 }),
      lookup: async () => {
        lookups += 1;
        return new Response(JSON.stringify({ state: "completed", entryId: "e1" }), { status: 200 });
      },
    };
    const wrapped = wrapJournalCreateDepsWithLocalE2eFaults(base, () => ACTOR);
    expect(await (await wrapped.lookup({ saveOperationId: "op", requestFingerprint: "fp" })).json()).toEqual({
      state: "processing",
    });
    expect(lookups).toBe(0);
    expect(await (await wrapped.lookup({ saveOperationId: "op", requestFingerprint: "fp" })).json()).toEqual({
      state: "not_found",
    });
    expect(lookups).toBe(0);
    expect(await (await wrapped.lookup({ saveOperationId: "op", requestFingerprint: "fp" })).json()).toEqual({
      state: "completed",
      entryId: "e1",
    });
    expect(lookups).toBe(1);
  });

  it("harness OFF leaves formal lookup/post unchanged", async () => {
    let posts = 0;
    let lookups = 0;
    const base: JournalCreateSaveOrchestratorDeps = {
      bootstrap: async () => ({ status: "unsupported_platform" }),
      capability: async () => ({ kind: "disabled" }),
      post: async () => {
        posts += 1;
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      },
      lookup: async () => {
        lookups += 1;
        return new Response(JSON.stringify({ state: "completed" }), { status: 200 });
      },
    };
    const wrapped = wrapJournalCreateDepsWithLocalE2eFaults(base, () => ACTOR);
    await wrapped.post({
      content: "x",
      mood: "calm",
      activity: "a",
      companionType: "owl",
      designTheme: "simple_plain",
      contentFontMode: "standard",
      entryDate: "2026-08-15",
      profileId: "p1",
    });
    await wrapped.lookup({ saveOperationId: "op", requestFingerprint: "fp" });
    expect(posts).toBe(1);
    expect(lookups).toBe(1);
  });

  it("native cleanup failure is one-shot and does not destroy rows", async () => {
    const store = createMemoryClientSaveOperationIntentStore();
    await store.tryInsert({
      intentId: "intent1",
      saveOperationId: "op1",
      actorKey: ACTOR,
      requestFingerprint: "fp",
      status: "awaiting_result",
      draftRef: null,
      serverEntryId: null,
      failureCode: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastAttemptAt: null,
      completedAt: null,
    });
    armLocalE2eFault({ mode: "native_cleanup_failure_once", actorKey: ACTOR });
    const wrapped = wrapIntentStoreWithNativeCleanupFault(store, ACTOR);
    await expect(wrapped.deleteByActor(ACTOR)).rejects.toThrow("local_e2e_native_cleanup_failure_once");
    expect(await store.listRecoverableByActor(ACTOR)).toHaveLength(1);
    expect(await wrapped.deleteByActor(ACTOR)).toBe(1);
    expect(await store.listRecoverableByActor(ACTOR)).toHaveLength(0);
  });
});
