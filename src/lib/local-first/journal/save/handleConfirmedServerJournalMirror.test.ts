import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ResolvedLocalJournalGeneration } from "@/lib/local-first/journal/generation/ResolvedLocalJournalGeneration";
import {
  createMemoryLocalMirrorOutboxStore,
} from "@/lib/local-first/journal/outbox/LocalMirrorOutboxStore";
import {
  attemptOutboxMirror,
  createRunMirrorFromPrimitiveDeps,
  enqueueBeforeMirror,
} from "@/lib/local-first/journal/outbox/LocalMirrorOutboxService";
import type { MirrorPrimitiveDeps } from "@/lib/local-first/journal/secureCopy/mirrorServerJournalEntry";
import type {
  CandidateMediaPort,
  JournalRepositoryPort,
} from "@/lib/local-first/journal/secureCopy/types";
import { SECURE_CANDIDATE_MEDIA_ROOT } from "@/lib/local-first/journal/secureCopy/types";
import type { ApiJournalEntry } from "@/lib/local-first/journal/serverFetch";
import type { LocalJournalEntry } from "@/lib/local-first/journal/types";
import { assertNoSecretInText } from "@/lib/local-first/security/noSecretLog";
import { SERVER_SUCCESS_TO_OUTBOX_GAP } from "@/lib/local-first/journal/save/releaseBlockers";

const TARGET: ResolvedLocalJournalGeneration = {
  generation: 2,
  databaseId: "ljd_local_journal_secure_candidate",
  mediaRootId: SECURE_CANDIDATE_MEDIA_ROOT,
  schemaVersion: 1,
  manifestChecksum: "checksum_a_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
};

const ENTRY_ID = "cmsppllhx0000kv04nmct79ak";

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => true),
    getPlatform: vi.fn(() => "ios"),
  },
}));

vi.mock("@/lib/local-first/journal/save/internalSaveMirrorGate", () => ({
  canRunInternalJournalSaveMirror: vi.fn(() => true),
  isInternalJournalSaveMirrorWiringEnabled: vi.fn(() => true),
}));

vi.mock("@/lib/local-first/journal/save/saveMirrorRoutingPreconditions", () => ({
  assertSaveMirrorRoutingPreconditions: vi.fn(async () => ({
    ok: true as const,
    target: TARGET,
    registryRow: {
      generationId: "gen_test000000000000000000000000000001",
      databaseId: TARGET.databaseId,
      mediaRootId: TARGET.mediaRootId,
      schemaVersion: 1,
      lifecycleState: "technical_active" as const,
      integrityStatus: "ok" as const,
      legacyGenerationAlias: "manifest-generation:2",
      createdAt: "2026-08-12T00:00:00.000Z",
      activatedAt: "2026-08-12T00:00:00.000Z",
      previousAt: null,
      retiredAt: null,
      quarantinedAt: null,
      registryFormatVersion: 1,
    },
    availableBytes: 50_000_000,
  })),
}));

const openOutboxMock = vi.fn();
vi.mock("@/lib/local-first/journal/outbox/LocalMirrorOutboxSqliteStore", () => ({
  openLocalMirrorOutboxSqliteStore: (...args: unknown[]) => openOutboxMock(...args),
}));

function apiEntry(partial?: Partial<ApiJournalEntry>): ApiJournalEntry {
  return {
    id: ENTRY_ID,
    content: "save wiring fixture\n\n#SaveWiringTest",
    createdAt: "2026-08-12T06:00:00.000Z",
    updatedAt: "2026-08-12T06:00:00.000Z",
    hasPhoto: false,
    ...partial,
  };
}

function memoryRepository(): JournalRepositoryPort & { rows: LocalJournalEntry[] } {
  const rows: LocalJournalEntry[] = [];
  return {
    rows,
    async save(entry) {
      const idx = rows.findIndex((r) => r.stableId === entry.stableId);
      if (idx >= 0) rows[idx] = entry;
      else rows.push(entry);
    },
    async getById(stableId) {
      return rows.find((r) => r.stableId === stableId) ?? null;
    },
    async getByLegacyServerId(legacyServerId) {
      return rows.find((r) => r.legacyServerId === legacyServerId) ?? null;
    },
    async countEntries() {
      return rows.length;
    },
    async countTags() {
      return rows.reduce((n, r) => n + r.tags.length, 0);
    },
    async countMedia() {
      return rows.reduce((n, r) => n + r.mediaRefs.length, 0);
    },
  };
}

function memoryMedia(): CandidateMediaPort {
  const files = new Map<string, string>();
  return {
    root: SECURE_CANDIDATE_MEDIA_ROOT,
    async write(fileName, base64) {
      const path = `${SECURE_CANDIDATE_MEDIA_ROOT}/${fileName}`;
      files.set(path, base64);
      return path;
    },
    async readBase64(relativePath) {
      return files.get(relativePath) ?? "";
    },
    async delete(relativePath) {
      files.delete(relativePath);
    },
  };
}

function mirrorDeps(options?: {
  injectLocalFailure?: "save" | "media_write" | false;
}): MirrorPrimitiveDeps {
  const repo = memoryRepository();
  return {
    fetchEntry: async (id) => ({ ok: true, entry: apiEntry({ id }) }),
    downloadPhoto: async () => ({
      ok: true,
      base64: "",
      byteLength: 0,
      mimeType: "image/jpeg",
    }),
    repository: repo,
    media: memoryMedia(),
    createStableId: () => `stable_${Math.random().toString(36).slice(2, 10)}`,
    injectLocalFailure: options?.injectLocalFailure ?? false,
  };
}

describe("handleConfirmedServerJournalMirror (4B-4L)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const store = createMemoryLocalMirrorOutboxStore();
    openOutboxMock.mockResolvedValue({
      store,
      close: async () => undefined,
      encrypted: true,
      completeProtection: true,
      backupExcluded: true,
    });
    const gate = await import("@/lib/local-first/journal/save/internalSaveMirrorGate");
    vi.mocked(gate.canRunInternalJournalSaveMirror).mockReturnValue(true);
    const routing = await import(
      "@/lib/local-first/journal/save/saveMirrorRoutingPreconditions"
    );
    vi.mocked(routing.assertSaveMirrorRoutingPreconditions).mockResolvedValue({
      ok: true,
      target: TARGET,
      registryRow: {
        generationId: "gen_test",
        databaseId: TARGET.databaseId,
        mediaRootId: TARGET.mediaRootId,
        schemaVersion: 1,
        lifecycleState: "technical_active",
        integrityStatus: "ok",
        legacyGenerationAlias: "manifest-generation:2",
        createdAt: "2026-08-12T00:00:00.000Z",
        activatedAt: "2026-08-12T00:00:00.000Z",
        previousAt: null,
        retiredAt: null,
        quarantinedAt: null,
        registryFormatVersion: 1,
      },
      availableBytes: 50_000_000,
    });
  });

  it("gate OFF → disabled", async () => {
    const gate = await import("@/lib/local-first/journal/save/internalSaveMirrorGate");
    vi.mocked(gate.canRunInternalJournalSaveMirror).mockReturnValue(false);
    const { handleConfirmedServerJournalMirror } = await import(
      "@/lib/local-first/journal/save/handleConfirmedServerJournalMirror"
    );
    const result = await handleConfirmedServerJournalMirror({
      serverEntryId: ENTRY_ID,
    });
    expect(result.status).toBe("disabled");
    expect(openOutboxMock).not.toHaveBeenCalled();
  });

  it("routing fail-closed → routing_unavailable", async () => {
    const routing = await import(
      "@/lib/local-first/journal/save/saveMirrorRoutingPreconditions"
    );
    vi.mocked(routing.assertSaveMirrorRoutingPreconditions).mockResolvedValue({
      ok: false,
      reason: "registry_quarantined",
      detail: "quarantined",
    });
    const { handleConfirmedServerJournalMirror } = await import(
      "@/lib/local-first/journal/save/handleConfirmedServerJournalMirror"
    );
    const result = await handleConfirmedServerJournalMirror({
      serverEntryId: ENTRY_ID,
    });
    expect(result.status).toBe("routing_unavailable");
    expect(openOutboxMock).not.toHaveBeenCalled();
  });

  it("simulateCrashBeforeEnqueue models SERVER_SUCCESS_TO_OUTBOX_GAP", async () => {
    const { handleConfirmedServerJournalMirror } = await import(
      "@/lib/local-first/journal/save/handleConfirmedServerJournalMirror"
    );
    const result = await handleConfirmedServerJournalMirror({
      serverEntryId: ENTRY_ID,
      developer: { simulateCrashBeforeEnqueue: true },
    });
    expect(result.status).toBe("queued_retry");
    if (result.status === "queued_retry") {
      expect(result.lastResult).toBe("not_enqueued");
      expect(result.detail).toBe(SERVER_SUCCESS_TO_OUTBOX_GAP);
      expect(result.outboxItemId).toBeNull();
    }
    expect(openOutboxMock).not.toHaveBeenCalled();
  });

  it("gate ON → enqueue-before-mirror → mirrored", async () => {
    vi.doUnmock("@/lib/local-first/journal/save/createNativeSaveMirrorDeps");
    const store = createMemoryLocalMirrorOutboxStore();
    openOutboxMock.mockResolvedValue({
      store,
      close: async () => undefined,
    });

    const { createNativeSaveMirrorOrchestrationDeps } = await import(
      "@/lib/local-first/journal/save/createNativeSaveMirrorDeps"
    );
    const { handleConfirmedServerJournalMirror: realHandler } = await import(
      "@/lib/local-first/journal/save/handleConfirmedServerJournalMirror"
    );

    const originalCreate = createNativeSaveMirrorOrchestrationDeps;
    vi.spyOn(
      await import("@/lib/local-first/journal/save/createNativeSaveMirrorDeps"),
      "createNativeSaveMirrorOrchestrationDeps",
    ).mockImplementation((input) => {
      const { runMirror, peekLastFetchCode } = createRunMirrorFromPrimitiveDeps(
        mirrorDeps(),
      );
      return {
        store: input.store,
        resolvePinnedGeneration: async () => ({ ok: true, target: TARGET }),
        runMirror,
        peekLastFetchCode,
        availableBytes: input.availableBytes ?? null,
      };
    });

    const result = await realHandler({ serverEntryId: ENTRY_ID });
    expect(result.status).toBe("mirrored");
    expect(openOutboxMock).toHaveBeenCalled();
    const pending = await store.listPending();
    expect(pending).toHaveLength(0);
    originalCreate;
  });

  it("Local failure after enqueue retains pending (queued_retry)", async () => {
    const store = createMemoryLocalMirrorOutboxStore();
    openOutboxMock.mockResolvedValue({
      store,
      close: async () => undefined,
    });

    vi.spyOn(
      await import("@/lib/local-first/journal/save/createNativeSaveMirrorDeps"),
      "createNativeSaveMirrorOrchestrationDeps",
    ).mockImplementation((input) => {
      const { runMirror, peekLastFetchCode } = createRunMirrorFromPrimitiveDeps(
        mirrorDeps({ injectLocalFailure: "save" }),
      );
      return {
        store: input.store,
        resolvePinnedGeneration: async () => ({ ok: true, target: TARGET }),
        runMirror,
        peekLastFetchCode,
        availableBytes: input.availableBytes ?? null,
      };
    });

    const { handleConfirmedServerJournalMirror } = await import(
      "@/lib/local-first/journal/save/handleConfirmedServerJournalMirror"
    );
    const result = await handleConfirmedServerJournalMirror({
      serverEntryId: ENTRY_ID,
      developer: { injectLocalFailureAfterEnqueue: "save" },
    });
    expect(result.status).toBe("queued_retry");
    const pending = await store.listPending();
    expect(pending).toHaveLength(1);
    expect(pending[0]?.lastResult).toBe("retry_needed");
  });

  it("manual retry succeeds without Server create (mirrored → ack)", async () => {
    const store = createMemoryLocalMirrorOutboxStore();
    const enqueue = await enqueueBeforeMirror(
      { store },
      { serverEntryId: ENTRY_ID, target: TARGET },
    );
    await store.updateAttempt({
      id: enqueue.item.id,
      lastResult: "retry_needed",
      lastAttemptAt: new Date().toISOString(),
      incrementRetry: true,
    });

    const { runMirror, peekLastFetchCode } = createRunMirrorFromPrimitiveDeps(
      mirrorDeps(),
    );
    const attempt = await attemptOutboxMirror(
      {
        store,
        resolvePinnedGeneration: async () => ({ ok: true, target: TARGET }),
        runMirror,
        peekLastFetchCode,
      },
      enqueue.item.id,
    );
    expect(attempt.kind).toBe("acked");
    expect(await store.listPending()).toHaveLength(0);
  });

  it("already_present on retry acks safely", async () => {
    const store = createMemoryLocalMirrorOutboxStore();
    const deps = mirrorDeps();
    const repo = deps.repository as JournalRepositoryPort & {
      rows: LocalJournalEntry[];
    };
    const { runMirror, peekLastFetchCode } = createRunMirrorFromPrimitiveDeps(deps);
    await runMirror(ENTRY_ID, 50_000_000);
    expect(repo.rows).toHaveLength(1);

    const enqueue = await enqueueBeforeMirror(
      { store },
      { serverEntryId: ENTRY_ID, target: TARGET },
    );
    const attempt = await attemptOutboxMirror(
      {
        store,
        resolvePinnedGeneration: async () => ({ ok: true, target: TARGET }),
        runMirror,
        peekLastFetchCode,
      },
      enqueue.item.id,
    );
    expect(attempt.kind).toBe("acked");
    if (attempt.kind === "acked") {
      expect(attempt.mirrorStatus).toBe("already_present");
    }
  });

  it("generation drift forbids silent retarget", async () => {
    const store = createMemoryLocalMirrorOutboxStore();
    const enqueue = await enqueueBeforeMirror(
      { store },
      { serverEntryId: ENTRY_ID, target: TARGET },
    );
    const drifted: ResolvedLocalJournalGeneration = {
      ...TARGET,
      databaseId: "ljd_local_journal_secure_candidate_b",
      mediaRootId: "ljd/media/journal-secure-candidate-b",
      manifestChecksum: "checksum_b_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    };
    const { runMirror, peekLastFetchCode } = createRunMirrorFromPrimitiveDeps(
      mirrorDeps(),
    );
    const attempt = await attemptOutboxMirror(
      {
        store,
        resolvePinnedGeneration: async () => ({ ok: true, target: drifted }),
        runMirror,
        peekLastFetchCode,
      },
      enqueue.item.id,
    );
    expect(attempt.kind).toBe("retained");
    if (attempt.kind === "retained") {
      expect(attempt.lastResult).toBe("generation_changed");
    }
  });

  it("does not log content/secrets in result detail paths", () => {
    assertNoSecretInText(JSON.stringify({ status: "mirrored", serverEntryId: ENTRY_ID }));
    assertNoSecretInText(SERVER_SUCCESS_TO_OUTBOX_GAP);
  });
});
