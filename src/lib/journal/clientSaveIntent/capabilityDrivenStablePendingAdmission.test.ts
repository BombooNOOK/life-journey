/**
 * AI-X6.8A3 capability-driven stable pending admission tests.
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { buildFirebaseActorKey } from "@/lib/auth/firebaseActorKey";
import {
  parseSaveCapabilityAdmission,
  runJournalCreateSave,
  shouldRequireStableActorKeyForPending,
  type JournalCreatePayload,
  type JournalCreateSaveOrchestratorDeps,
} from "@/lib/journal/clientSaveIntent/JournalCreateSaveOrchestrator";
import { createMemoryClientSaveOperationIntentStore } from "@/lib/journal/clientSaveIntent/memoryStore";
import {
  NATIVE_STABLE_PENDING_INTENT_CLIENT_FLAG,
  NATIVE_STABLE_PENDING_INTENT_FLAG,
} from "@/lib/journal/clientSaveIntent/nativeStablePendingIntentGate";
import {
  resolveSaveCapability,
  resolveStableActorAdmission,
} from "@/lib/journal/saveIdempotency/rolloutProtocol";

const payload: JournalCreatePayload = {
  content: "admission body",
  mood: "calm",
  activity: "record_anyway",
  companionType: "owl",
  designTheme: "simple_plain",
  contentFontMode: "standard",
  entryDate: "2026-09-01",
  profileId: "profile_1",
  includeInBook: true,
};

const UID_C = "UID-CANARY-TEST";
const EMAIL_C = "canary@example.com";

function withNativeMaster(enabled: boolean) {
  if (enabled) {
    vi.stubEnv(NATIVE_STABLE_PENDING_INTENT_FLAG, "YES");
    vi.stubEnv(NATIVE_STABLE_PENDING_INTENT_CLIENT_FLAG, "YES");
  } else {
    vi.stubEnv(NATIVE_STABLE_PENDING_INTENT_FLAG, "");
    vi.stubEnv(NATIVE_STABLE_PENDING_INTENT_CLIENT_FLAG, "");
  }
}

function orchestratorDeps(input: {
  stableActorAdmission: boolean;
  idempotentEnabled?: boolean;
}) {
  const store = createMemoryClientSaveOperationIntentStore();
  const post = vi.fn(async () =>
    new Response(JSON.stringify({ entry: { id: "entry_1" } }), { status: 200 }),
  );
  const legacyPost = vi.fn(async () =>
    new Response(JSON.stringify({ entry: { id: "legacy_1" } }), { status: 200 }),
  );
  const deps: JournalCreateSaveOrchestratorDeps = {
    bootstrap: async () => ({ status: "ready", store }),
    capability: async () =>
      input.idempotentEnabled === false
        ? { kind: "disabled" }
        : { kind: "enabled", stableActorAdmission: input.stableActorAdmission },
    post: input.idempotentEnabled === false ? legacyPost : post,
    lookup: async () => new Response(JSON.stringify({ state: "not_found" }), { status: 200 }),
  };
  return { store, deps, post, legacyPost };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("AI-X6.8A3 stableActorAdmission protocol", () => {
  it.each([
    [false, "legacy", false],
    [false, "stable", false],
    [true, "legacy", false],
    [true, "stable", true],
  ] as const)("resolveStableActorAdmission idempotent=%s mode=%s → %s", (enabled, mode, expected) => {
    expect(
      resolveStableActorAdmission({
        idempotentSaveEnabled: enabled,
        writeActorMode: mode,
      }),
    ).toBe(expected);
  });

  it("legacy enabled rollout never produces stableActorAdmission", () => {
    const cap = resolveSaveCapability({
      globalEnabled: true,
      rollout: { enabled: true, protocolVersion: 1 },
      writeActorMode: "legacy",
    });
    expect(cap.idempotentSaveEnabled).toBe(true);
    expect(cap.stableActorAdmission).toBe(false);
  });

  it("firebase rollout + stable write actor produces stableActorAdmission", () => {
    const cap = resolveSaveCapability({
      globalEnabled: true,
      rollout: { enabled: true, protocolVersion: 1 },
      writeActorMode: "stable",
    });
    expect(cap).toMatchObject({
      idempotentSaveEnabled: true,
      stableActorAdmission: true,
    });
  });

  it("disabled firebase rollout keeps stableActorAdmission false", () => {
    const cap = resolveSaveCapability({
      globalEnabled: true,
      rollout: { enabled: false, protocolVersion: 1 },
      writeActorMode: "stable",
    });
    expect(cap.stableActorAdmission).toBe(false);
  });

  it("OLD client parser ignores unknown stableActorAdmission field safely", () => {
    expect(
      parseSaveCapabilityAdmission({
        protocolVersion: 1,
        idempotentSaveEnabled: true,
        lookupSupported: true,
        foregroundRecoverySupported: true,
        automaticBackgroundRetry: false,
      }),
    ).toEqual({ kind: "enabled", stableActorAdmission: false });
  });

  it("NEW client parser consumes stableActorAdmission", () => {
    expect(
      parseSaveCapabilityAdmission({
        protocolVersion: 1,
        idempotentSaveEnabled: true,
        stableActorAdmission: true,
      }),
    ).toEqual({ kind: "enabled", stableActorAdmission: true });
  });
});

describe("AI-X6.8A3 shouldRequireStableActorKeyForPending matrix", () => {
  it.each([
    [false, false, false],
    [false, true, false],
    [true, false, false],
    [true, true, true],
  ] as const)(
    "native=%s admission=%s → %s",
    (nativeMaster, admission, expected) => {
      expect(
        shouldRequireStableActorKeyForPending({
          nativeMasterEnabled: nativeMaster,
          capability:
            admission === true
              ? { kind: "enabled", stableActorAdmission: true }
              : { kind: "enabled", stableActorAdmission: false },
        }),
      ).toBe(expected && nativeMaster);
    },
  );
});

describe("AI-X6.8A3 orchestrator admission (C / N / U / windows)", () => {
  it("C canary: native master ON + stableActorAdmission true → stable pending", async () => {
    withNativeMaster(true);
    const { deps } = orchestratorDeps({ stableActorAdmission: true });
    const result = await runJournalCreateSave(
      { viewerEmail: EMAIL_C, firebaseUid: UID_C, payload },
      deps,
    );
    expect(result.kind).toBe("completed");
    if (result.kind === "completed" && result.intent) {
      expect(result.intent.stableActorKey).toBe(buildFirebaseActorKey(UID_C));
    }
  });

  it("N non-canary: native master ON + stableActorAdmission false → legacy pending only", async () => {
    withNativeMaster(true);
    const { deps } = orchestratorDeps({ stableActorAdmission: false });
    const result = await runJournalCreateSave(
      { viewerEmail: "other@example.com", firebaseUid: "UID-N", payload },
      deps,
    );
    expect(result.kind).toBe("completed");
    if (result.kind === "completed" && result.intent) {
      expect(result.intent.stableActorKey).toBeNull();
      expect(result.intent.actorKey).toBe("other@example.com");
    }
  });

  it("U unbound: native master ON + stableActorAdmission false → no stable_identity_unavailable", async () => {
    withNativeMaster(true);
    const { deps } = orchestratorDeps({ stableActorAdmission: false });
    const result = await runJournalCreateSave({ viewerEmail: "new@example.com", payload }, deps);
    expect(result.kind).toBe("completed");
    if (result.kind === "completed" && result.intent) {
      expect(result.intent.stableActorKey).toBeNull();
    }
  });

  it("U would fail only when stableActorAdmission true but UID missing", async () => {
    withNativeMaster(true);
    const { post, deps } = orchestratorDeps({ stableActorAdmission: true });
    const result = await runJournalCreateSave({ viewerEmail: "new@example.com", payload }, deps);
    expect(result).toMatchObject({
      kind: "protocol_start_failed",
      reason: "stable_identity_unavailable",
    });
    expect(post).not.toHaveBeenCalled();
  });

  it("WINDOW B: native master ON + idempotent disabled → legacy POST", async () => {
    withNativeMaster(true);
    const { legacyPost, deps } = orchestratorDeps({
      stableActorAdmission: false,
      idempotentEnabled: false,
    });
    const result = await runJournalCreateSave(
      { viewerEmail: EMAIL_C, firebaseUid: UID_C, payload },
      deps,
    );
    expect(result.kind).toBe("legacy");
    expect(legacyPost).toHaveBeenCalledTimes(1);
  });

  it("WINDOW A: native master OFF + stableActorAdmission true → no stable pending", async () => {
    withNativeMaster(false);
    const { deps } = orchestratorDeps({ stableActorAdmission: true });
    const result = await runJournalCreateSave(
      { viewerEmail: EMAIL_C, firebaseUid: UID_C, payload },
      deps,
    );
    expect(result.kind).toBe("completed");
    if (result.kind === "completed" && result.intent) {
      expect(result.intent.stableActorKey).toBeNull();
    }
  });
});
