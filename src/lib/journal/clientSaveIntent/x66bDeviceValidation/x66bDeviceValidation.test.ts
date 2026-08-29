import { afterEach, describe, expect, it, vi } from "vitest";

import { buildFirebaseActorKey } from "@/lib/auth/firebaseActorKey";
import {
  clearCurrentSessionJournalCreatePayloadsForTest,
  type JournalCreateSaveOrchestratorDeps,
} from "@/lib/journal/clientSaveIntent/JournalCreateSaveOrchestrator";
import { createMemoryClientSaveOperationIntentStore } from "@/lib/journal/clientSaveIntent/memoryStore";
import { NATIVE_STABLE_PENDING_INTENT_CLIENT_FLAG } from "@/lib/journal/clientSaveIntent/nativeStablePendingIntentGate";
import {
  assertEvidenceRedacted,
  emptyX66bEvidence,
  evaluateX66bDeviceValidationGate,
  isX66bDeviceValidationPageAllowed,
  runX66bCreatePendingAutorun,
  runX66bRecoveryAutorun,
  X66B_DEVICE_VALIDATION_AUTORUN_FLAG,
  X66B_VALIDATION_CONTENT,
} from "@/lib/journal/clientSaveIntent/x66bDeviceValidation";

function mockUser(email: string, uid: string) {
  return { email, uid } as import("firebase/auth").User;
}

function createTestDeps(postImpl?: () => Promise<Response>): JournalCreateSaveOrchestratorDeps {
  const store = createMemoryClientSaveOperationIntentStore();
  const post =
    postImpl ??
    vi.fn(async () => new Response(JSON.stringify({ entry: { id: "entry_1" } }), { status: 200 }));
  return {
    bootstrap: async () => ({ status: "ready", store }),
    capability: async () => ({ kind: "enabled" }),
    post,
    postExactJson: async () => post(),
    lookup: async () => new Response(JSON.stringify({ state: "not_found" }), { status: 200 }),
  };
}

describe("X6.6B0 device validation autorun gate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("A/I: production environment fail-closed", () => {
    const gate = evaluateX66bDeviceValidationGate({
      nodeEnv: "production",
      flag: "YES",
    });
    expect(gate.pageAllowed).toBe(false);
    expect(gate.operationsAllowed).toBe(false);
    expect(gate.reason).toBe("production_build");
    expect(isX66bDeviceValidationPageAllowed({ nodeEnv: "production", flag: "YES" })).toBe(
      false,
    );
  });

  it("B: autorun flag OFF = no operations", () => {
    const gate = evaluateX66bDeviceValidationGate({
      nodeEnv: "development",
      flag: "",
    });
    expect(gate.pageAllowed).toBe(false);
    expect(gate.reason).toBe("flag_off");
  });

  it("development + flag YES allows page", () => {
    expect(
      evaluateX66bDeviceValidationGate({ nodeEnv: "development", flag: "YES" }).ok,
    ).toBe(true);
  });
});

describe("X6.6B0 autorun controller", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    clearCurrentSessionJournalCreatePayloadsForTest();
  });

  function enableHarness() {
    vi.stubEnv(X66B_DEVICE_VALIDATION_AUTORUN_FLAG, "YES");
    vi.stubEnv(NATIVE_STABLE_PENDING_INTENT_CLIENT_FLAG, "YES");
    vi.stubEnv("NODE_ENV", "development");
  }

  it("C: signed out = no save", async () => {
    enableHarness();
    const result = await runX66bCreatePendingAutorun({
      user: null,
      authLoading: false,
      profileId: "profile_1",
      depsBase: createTestDeps(),
      persistEvidence: false,
    });
    expect(result.state).toBe("AUTH_REQUIRED");
    expect(result.saveResult).toBeUndefined();
  });

  it("D: auth loading = defer", async () => {
    enableHarness();
    const result = await runX66bCreatePendingAutorun({
      user: mockUser("a@example.com", "UID-A"),
      authLoading: true,
      profileId: "profile_1",
      depsBase: createTestDeps(),
      persistEvidence: false,
    });
    expect(result.state).toBe("AUTH_WAIT");
  });

  it("B again: harness OFF via gate returns HARNESS_OFF without calling store", async () => {
    vi.stubEnv(X66B_DEVICE_VALIDATION_AUTORUN_FLAG, "");
    vi.stubEnv("NODE_ENV", "development");
    const post = vi.fn();
    const result = await runX66bCreatePendingAutorun({
      user: mockUser("a@example.com", "UID-A"),
      authLoading: false,
      profileId: "profile_1",
      depsBase: createTestDeps(post),
      persistEvidence: false,
    });
    expect(result.state).toBe("HARNESS_OFF");
    expect(post).not.toHaveBeenCalled();
  });

  it("E/F/G: matching UID reaches orchestrator; persist-before-POST; interrupt after durable", async () => {
    enableHarness();
    const post = vi.fn(async () => {
      throw new Error("should_not_reach_real_post_when_interrupted");
    });
    const deps = createTestDeps(post);
    const result = await runX66bCreatePendingAutorun({
      user: mockUser("person@example.com", "UID-A-REAL"),
      authLoading: false,
      profileId: "profile_1",
      interruptAfterPersist: true,
      depsBase: deps,
      persistEvidence: false,
    });
    expect(result.state).toBe("INTERRUPTION_READY");
    expect(result.saveResult?.kind).toBe("pending");
    expect(post).not.toHaveBeenCalled();

    const stages = result.evidence.phases.map((p) => p.stage);
    expect(stages).toContain("PENDING_DURABLE");
    expect(stages).toContain("POST_BEGIN");
    expect(stages).toContain("PENDING_PERSISTED");
    const durableIdx = stages.indexOf("PENDING_DURABLE");
    const postIdx = stages.indexOf("POST_BEGIN");
    expect(durableIdx).toBeGreaterThanOrEqual(0);
    expect(postIdx).toBeGreaterThan(durableIdx);
    expect(result.evidence.persistBeforePostOk).toBe(true);

    if (result.saveResult?.kind === "pending") {
      expect(result.saveResult.intent.stableActorKey).toBe(
        buildFirebaseActorKey("UID-A-REAL"),
      );
      expect(result.evidence.lastPayloadHash).toBe(
        result.saveResult.intent.requestFingerprint,
      );
    }
    expect(result.authAlias).toBe("UID-A");
  });

  it("H: evidence redacts UID/email/payload body", async () => {
    enableHarness();
    const email = "secret-user@example.com";
    const uid = "firebase-uid-should-never-appear";
    const result = await runX66bCreatePendingAutorun({
      user: mockUser(email, uid),
      authLoading: false,
      profileId: "profile_1",
      interruptAfterPersist: true,
      depsBase: createTestDeps(),
      persistEvidence: false,
    });
    const check = assertEvidenceRedacted(result.evidence, {
      emails: [email],
      uids: [uid],
      payloads: [X66B_VALIDATION_CONTENT],
    });
    expect(check).toEqual({ ok: true });
    const blob = JSON.stringify(result.evidence);
    expect(blob).not.toContain(email);
    expect(blob).not.toContain(uid);
    expect(blob).not.toContain(X66B_VALIDATION_CONTENT);
  });

  it("recovery uses same saveOperationId alias and payload hash", async () => {
    enableHarness();
    const store = createMemoryClientSaveOperationIntentStore();
    let postCalls = 0;
    const deps: JournalCreateSaveOrchestratorDeps = {
      bootstrap: async () => ({ status: "ready", store }),
      capability: async () => ({ kind: "enabled" }),
      post: async () => {
        postCalls += 1;
        return new Response(JSON.stringify({ entry: { id: "entry_ok" } }), { status: 200 });
      },
      lookup: async () => new Response(JSON.stringify({ state: "not_found" }), { status: 200 }),
    };

    const created = await runX66bCreatePendingAutorun({
      user: mockUser("person@example.com", "UID-A-REAL"),
      authLoading: false,
      profileId: "profile_1",
      interruptAfterPersist: true,
      depsBase: deps,
      persistEvidence: false,
      evidence: emptyX66bEvidence(),
    });
    expect(created.state).toBe("INTERRUPTION_READY");
    expect(postCalls).toBe(0);

    const recovered = await runX66bRecoveryAutorun({
      user: mockUser("person@example.com", "UID-A-REAL"),
      authLoading: false,
      evidence: created.evidence,
      depsBase: deps,
      persistEvidence: false,
    });
    expect(recovered.state).toBe("COMPLETED");
    expect(postCalls).toBe(1);
    expect(recovered.evidence.lastSaveOperationIdAlias).toBe(
      created.evidence.lastSaveOperationIdAlias,
    );
    expect(recovered.evidence.lastPayloadHash).toBe(created.evidence.lastPayloadHash);
    expect(recovered.evidence.duplicateSaveDetected).toBe(false);
  });

  it("J: production gate blocks autorun even if flag YES", async () => {
    vi.stubEnv(X66B_DEVICE_VALIDATION_AUTORUN_FLAG, "YES");
    vi.stubEnv("NODE_ENV", "production");
    const result = await runX66bCreatePendingAutorun({
      user: mockUser("a@example.com", "UID-A"),
      authLoading: false,
      profileId: "profile_1",
      depsBase: createTestDeps(),
      persistEvidence: false,
    });
    expect(result.state).toBe("FAILED");
    expect(result.evidence.phases.at(-1)?.note).toBe("production_build");
  });
});
