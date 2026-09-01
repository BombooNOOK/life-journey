import { afterEach, describe, expect, it, vi } from "vitest";

import { buildFirebaseActorKey } from "@/lib/auth/firebaseActorKey";
import {
  buildClientSaveIntentOrchestratorSession,
  resolveClientSaveIntentAuthSession,
} from "@/lib/journal/clientSaveIntent/clientSaveIntentAuthSession";
import {
  clearCurrentSessionJournalCreatePayloadsForTest,
  recoverJournalCreateSaves,
  runForegroundJournalCreateRecovery,
  runJournalCreateSave,
  type JournalCreatePayload,
  type JournalCreateSaveOrchestratorDeps,
} from "@/lib/journal/clientSaveIntent/JournalCreateSaveOrchestrator";
import { createMemoryClientSaveOperationIntentStore } from "@/lib/journal/clientSaveIntent/memoryStore";
import {
  NATIVE_STABLE_PENDING_INTENT_CLIENT_FLAG,
  NATIVE_STABLE_PENDING_INTENT_FLAG,
} from "@/lib/journal/clientSaveIntent/nativeStablePendingIntentGate";

const payload: JournalCreatePayload = {
  content: "wiring body",
  mood: "calm",
  activity: "record_anyway",
  companionType: "owl",
  designTheme: "simple_plain",
  contentFontMode: "standard",
  entryDate: "2026-08-28",
  profileId: "profile_1",
  includeInBook: true,
};

function mockUser(email: string, uid: string) {
  return { email, uid } as import("firebase/auth").User;
}

function createDeps(
  postImpl?: () => Promise<Response>,
  options?: { stableActorAdmission?: boolean },
) {
  const store = createMemoryClientSaveOperationIntentStore();
  const post =
    postImpl ??
    vi.fn(async () => new Response(JSON.stringify({ entry: { id: "entry_1" } }), { status: 200 }));
  const stableActorAdmission = options?.stableActorAdmission ?? true;
  const deps: JournalCreateSaveOrchestratorDeps = {
    bootstrap: async () => ({ status: "ready", store }),
    capability: async () => ({ kind: "enabled", stableActorAdmission }),
    post,
    lookup: async () => new Response(JSON.stringify({ state: "not_found" }), { status: 200 }),
  };
  return { store, deps, post };
}

describe("clientSaveIntentAuthSession", () => {
  it("waits while auth is loading", () => {
    const session = resolveClientSaveIntentAuthSession({
      user: mockUser("a@example.com", "UID-A"),
      authLoading: true,
    });
    expect(session.sessionReady).toBe(false);
    expect(buildClientSaveIntentOrchestratorSession(session)).toBeNull();
  });

  it("treats signed-out as not ready", () => {
    const session = resolveClientSaveIntentAuthSession({ user: null, authLoading: false });
    expect(session.sessionReady).toBe(false);
    expect(session.firebaseUid).toBeNull();
  });

  it("extracts email and uid when auth is ready", () => {
    const session = resolveClientSaveIntentAuthSession({
      user: mockUser("Person@example.com", "UID-A"),
      authLoading: false,
    });
    expect(session.sessionReady).toBe(true);
    expect(session.viewerEmail).toBe("Person@example.com");
    expect(session.firebaseUid).toBe("UID-A");
    expect(buildClientSaveIntentOrchestratorSession(session)).toEqual({
      viewerEmail: "Person@example.com",
      firebaseUid: "UID-A",
    });
  });
});

describe("AI-X6.6A2 client wiring into orchestrator", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    clearCurrentSessionJournalCreatePayloadsForTest();
  });

  it("flag OFF: save works without requiring stable UID", async () => {
    // Explicit OFF — local .env.local may set NEXT_PUBLIC_*=YES for device validation.
    vi.stubEnv(NATIVE_STABLE_PENDING_INTENT_FLAG, "");
    vi.stubEnv(NATIVE_STABLE_PENDING_INTENT_CLIENT_FLAG, "");
    const orchestratorSession = buildClientSaveIntentOrchestratorSession(
      resolveClientSaveIntentAuthSession({
        user: mockUser("person@example.com", "UID-A"),
        authLoading: false,
      }),
    )!;
    const { deps } = createDeps();
    const result = await runJournalCreateSave({ ...orchestratorSession, payload }, deps);
    expect(result.kind).toBe("completed");
    if (result.kind === "completed" && result.intent) {
      expect(result.intent.stableActorKey).toBeNull();
    }
  });

  it("flag ON: wired save passes UID into stable pending intent", async () => {
    vi.stubEnv(NATIVE_STABLE_PENDING_INTENT_FLAG, "YES");
    const orchestratorSession = buildClientSaveIntentOrchestratorSession(
      resolveClientSaveIntentAuthSession({
        user: mockUser("person@example.com", "UID-A"),
        authLoading: false,
      }),
    )!;
    const { deps } = createDeps();
    const result = await runJournalCreateSave({ ...orchestratorSession, payload }, deps);
    expect(result.kind).toBe("completed");
    if (result.kind === "completed" && result.intent) {
      expect(result.intent.stableActorKey).toBe(buildFirebaseActorKey("UID-A"));
    }
  });

  it("flag ON: recovery receives firebaseUid for stable lookup after email change", async () => {
    vi.stubEnv(NATIVE_STABLE_PENDING_INTENT_FLAG, "YES");
    const { store, deps } = createDeps(async () => {
      throw new Error("network_down");
    });
    const orchestratorSession = buildClientSaveIntentOrchestratorSession(
      resolveClientSaveIntentAuthSession({
        user: mockUser("old@example.com", "UID-A"),
        authLoading: false,
      }),
    )!;
    const pending = await runJournalCreateSave({ ...orchestratorSession, payload }, deps);
    expect(pending.kind).toBe("pending");
    if (pending.kind !== "pending") return;

    const replayPost = vi.fn(async () =>
      new Response(JSON.stringify({ entry: { id: "entry_2" } }), { status: 200 }),
    );
    const recovered = await recoverJournalCreateSaves(
      { viewerEmail: "new@example.com", firebaseUid: "UID-A" },
      { ...deps, postExactJson: replayPost },
    );
    expect(recovered.some((r) => r.kind === "completed")).toBe(true);
    const row = await store.findByStableActorAndSaveOperationId(
      buildFirebaseActorKey("UID-A"),
      pending.intent.saveOperationId,
    );
    expect(row?.actorKey).toBe("old@example.com");
  });

  it("runForegroundJournalCreateRecovery recovers stable pending with wired firebaseUid", async () => {
    vi.stubEnv(NATIVE_STABLE_PENDING_INTENT_FLAG, "YES");
    const { deps } = createDeps(async () => {
      throw new Error("network_down");
    });
    const orchestratorSession = buildClientSaveIntentOrchestratorSession(
      resolveClientSaveIntentAuthSession({
        user: mockUser("person@example.com", "UID-A"),
        authLoading: false,
      }),
    )!;
    const pending = await runJournalCreateSave({ ...orchestratorSession, payload }, deps);
    expect(pending.kind).toBe("pending");
    if (pending.kind !== "pending") return;

    const replayPost = vi.fn(async () =>
      new Response(JSON.stringify({ entry: { id: "entry_fg" } }), { status: 200 }),
    );
    const results = await runForegroundJournalCreateRecovery(
      { viewerEmail: "person@example.com", firebaseUid: "UID-A" },
      { ...deps, postExactJson: replayPost },
    );
    expect(results.some((r) => r.kind === "completed")).toBe(true);
    expect(replayPost).toHaveBeenCalled();
  });
});
