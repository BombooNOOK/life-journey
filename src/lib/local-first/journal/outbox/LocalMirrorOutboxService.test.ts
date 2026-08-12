import { describe, expect, it } from "vitest";

import type { ResolvedLocalJournalGeneration } from "@/lib/local-first/journal/generation/ResolvedLocalJournalGeneration";
import {
  createMemoryLocalMirrorOutboxStore,
  reopenMemoryLocalMirrorOutboxStore,
} from "@/lib/local-first/journal/outbox/LocalMirrorOutboxStore";
import {
  attemptOutboxMirror,
  createRunMirrorFromPrimitiveDeps,
  enqueueBeforeMirror,
  orchestrateEnqueueThenMirror,
  redactServerEntryIdForLog,
  targetIdentityMatchesItem,
} from "@/lib/local-first/journal/outbox/LocalMirrorOutboxService";
import {
  OUTBOX_FORBIDDEN_PERSISTED_KEYS,
  opaqueGenerationIdFromResolved,
  type LocalMirrorOutboxItem,
} from "@/lib/local-first/journal/outbox/types";
import type { MirrorPrimitiveDeps } from "@/lib/local-first/journal/secureCopy/mirrorServerJournalEntry";
import type {
  CandidateMediaPort,
  JournalRepositoryPort,
} from "@/lib/local-first/journal/secureCopy/types";
import { SECURE_CANDIDATE_MEDIA_ROOT } from "@/lib/local-first/journal/secureCopy/types";
import type { ApiJournalEntry } from "@/lib/local-first/journal/serverFetch";
import { LOCAL_JOURNAL_DB_NAME, LOCAL_JOURNAL_MEDIA_ROOT } from "@/lib/local-first/journal/types";
import type { LocalJournalEntry } from "@/lib/local-first/journal/types";
import { assertNoSecretInText } from "@/lib/local-first/security/noSecretLog";


const TARGET_A: ResolvedLocalJournalGeneration = {
  generation: 2,
  databaseId: "ljd_local_journal_secure_candidate",
  mediaRootId: SECURE_CANDIDATE_MEDIA_ROOT,
  schemaVersion: 1,
  manifestChecksum: "checksum_a_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
};

const TARGET_B: ResolvedLocalJournalGeneration = {
  generation: 3,
  databaseId: "ljd_local_journal_secure_candidate_b",
  mediaRootId: "ljd/media/journal-secure-candidate-b",
  schemaVersion: 1,
  manifestChecksum: "checksum_b_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
};

const ENTRY_ID = "cmsppllhx0000kv04nmct79ak";

function apiEntry(partial?: Partial<ApiJournalEntry>): ApiJournalEntry {
  return {
    id: ENTRY_ID,
    content: "outbox fixture body\n\n#WriteThroughTest #テスト",
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
  entry?: ApiJournalEntry | null;
  fetchCode?: string;
  injectLocalFailure?: "save" | "media_write" | false;
  repository?: JournalRepositoryPort & { rows: LocalJournalEntry[] };
}): MirrorPrimitiveDeps & {
  repository: JournalRepositoryPort & { rows: LocalJournalEntry[] };
  serverCreateCalls: number;
  donguriCalls: number;
} {
  const repository = options?.repository ?? memoryRepository();
  let serverCreateCalls = 0;
  let donguriCalls = 0;
  return {
    repository,
    serverCreateCalls,
    donguriCalls,
    media: memoryMedia(),
    createStableId: () => `sid_${repository.rows.length + 1}`,
    injectLocalFailure: options?.injectLocalFailure ?? false,
    fetchEntry: async () => {
      if (options?.fetchCode) {
        return {
          ok: false as const,
          code: options.fetchCode,
          message: options.fetchCode === "NOT_FOUND" ? "対象の記録が見つかりません。" : "fail",
        };
      }
      if (options?.entry === null) {
        return { ok: false as const, code: "NOT_FOUND", message: "対象の記録が見つかりません。" };
      }
      return { ok: true as const, entry: options?.entry ?? apiEntry() };
    },
    downloadPhoto: async () => ({
      ok: true as const,
      base64: btoa("photo"),
      byteLength: 5,
      mimeType: "image/jpeg",
    }),
    // Track accidental Server-create / donguri surface (must stay 0)
    get _serverCreateCalls() {
      return serverCreateCalls;
    },
    get _donguriCalls() {
      return donguriCalls;
    },
  } as MirrorPrimitiveDeps & {
    repository: JournalRepositoryPort & { rows: LocalJournalEntry[] };
    serverCreateCalls: number;
    donguriCalls: number;
  };
}

describe("LocalMirrorOutbox — enqueue / idempotency / persistence", () => {
  it("first enqueue creates a row with generation snapshot", async () => {
    const store = createMemoryLocalMirrorOutboxStore();
    const result = await enqueueBeforeMirror({ store }, {
      serverEntryId: ENTRY_ID,
      target: TARGET_A,
      now: "2026-08-12T10:00:00.000Z",
    });
    expect(result.created).toBe(true);
    expect(result.item.serverEntryId).toBe(ENTRY_ID);
    expect(result.item.targetGenerationId).toBe(
      opaqueGenerationIdFromResolved(TARGET_A),
    );
    expect(result.item.targetDatabaseId).toBe(TARGET_A.databaseId);
    expect(result.item.targetMediaRootId).toBe(TARGET_A.mediaRootId);
    expect(result.item.manifestChecksumAtEnqueue).toBe(TARGET_A.manifestChecksum);
    expect(result.item.retryCount).toBe(0);
    expect(result.item.lastResult).toBeNull();
  });

  it("duplicate enqueue is idempotent (no row proliferation)", async () => {
    const store = createMemoryLocalMirrorOutboxStore();
    const a = await enqueueBeforeMirror({ store }, {
      serverEntryId: ENTRY_ID,
      target: TARGET_A,
    });
    const b = await enqueueBeforeMirror({ store }, {
      serverEntryId: ENTRY_ID,
      target: TARGET_A,
    });
    expect(b.created).toBe(false);
    expect(b.item.id).toBe(a.item.id);
    expect((await store.listPending()).length).toBe(1);
  });

  it("persists after reopen (crash-before-mirror O1)", async () => {
    const store = createMemoryLocalMirrorOutboxStore();
    await enqueueBeforeMirror({ store }, {
      serverEntryId: ENTRY_ID,
      target: TARGET_A,
    });
    // kill before mirror
    const relaunched = reopenMemoryLocalMirrorOutboxStore(store);
    const pending = await relaunched.listPending();
    expect(pending).toHaveLength(1);
    expect(pending[0]!.serverEntryId).toBe(ENTRY_ID);
    expect(pending[0]!.lastResult).toBeNull();
  });

  it("rejects plaintext production DB target", async () => {
    const store = createMemoryLocalMirrorOutboxStore();
    await expect(
      enqueueBeforeMirror({ store }, {
        serverEntryId: ENTRY_ID,
        target: {
          ...TARGET_A,
          databaseId: LOCAL_JOURNAL_DB_NAME,
          mediaRootId: LOCAL_JOURNAL_MEDIA_ROOT,
        },
      }),
    ).rejects.toThrow(/plaintext/);
  });

  it("does not persist content / photo / secret fields", async () => {
    const store = createMemoryLocalMirrorOutboxStore();
    await enqueueBeforeMirror({ store }, {
      serverEntryId: ENTRY_ID,
      target: TARGET_A,
    });
    const dumped = JSON.stringify(await store.dumpRows());
    for (const key of OUTBOX_FORBIDDEN_PERSISTED_KEYS) {
      expect(dumped.includes(`"${key}"`)).toBe(false);
    }
    expect(dumped.includes("outbox fixture body")).toBe(false);
    assertNoSecretInText(dumped);
  });
});

describe("LocalMirrorOutbox — lifecycle / crash windows", () => {
  it("failure retains pending and increments retry (O3)", async () => {
    const store = createMemoryLocalMirrorOutboxStore();
    const deps = mirrorDeps({ injectLocalFailure: "save" });
    const enq = await enqueueBeforeMirror({ store }, {
      serverEntryId: ENTRY_ID,
      target: TARGET_A,
    });
    const attempt = await attemptOutboxMirror(
      {
        store,
        resolvePinnedGeneration: async () => ({ ok: true, target: TARGET_A }),
        ...createRunMirrorFromPrimitiveDeps(deps),
      },
      enq.item.id,
    );
    expect(attempt.kind).toBe("retained");
    if (attempt.kind !== "retained") return;
    expect(attempt.lastResult).toBe("retry_needed");
    expect(attempt.item.retryCount).toBe(1);
    expect((await store.listPending()).length).toBe(1);
  });

  it("retry success acks/removes pending (O4)", async () => {
    const store = createMemoryLocalMirrorOutboxStore();
    const deps = mirrorDeps({ injectLocalFailure: "save" });
    const enq = await enqueueBeforeMirror({ store }, {
      serverEntryId: ENTRY_ID,
      target: TARGET_A,
    });
    await attemptOutboxMirror(
      {
        store,
        resolvePinnedGeneration: async () => ({ ok: true, target: TARGET_A }),
        ...createRunMirrorFromPrimitiveDeps(deps),
      },
      enq.item.id,
    );

    const depsOk = mirrorDeps({ repository: deps.repository });
    const retry = await attemptOutboxMirror(
      {
        store,
        resolvePinnedGeneration: async () => ({ ok: true, target: TARGET_A }),
        ...createRunMirrorFromPrimitiveDeps(depsOk),
      },
      enq.item.id,
    );
    expect(retry.kind).toBe("acked");
    expect((await store.listPending()).length).toBe(0);
  });

  it("already_present removes/acks pending", async () => {
    const store = createMemoryLocalMirrorOutboxStore();
    const deps = mirrorDeps();
    const enq = await enqueueBeforeMirror({ store }, {
      serverEntryId: ENTRY_ID,
      target: TARGET_A,
    });
    const first = await attemptOutboxMirror(
      {
        store,
        resolvePinnedGeneration: async () => ({ ok: true, target: TARGET_A }),
        ...createRunMirrorFromPrimitiveDeps(deps),
      },
      enq.item.id,
    );
    expect(first.kind).toBe("acked");

    const enq2 = await enqueueBeforeMirror({ store }, {
      serverEntryId: ENTRY_ID,
      target: TARGET_A,
    });
    const second = await attemptOutboxMirror(
      {
        store,
        resolvePinnedGeneration: async () => ({ ok: true, target: TARGET_A }),
        ...createRunMirrorFromPrimitiveDeps(deps),
      },
      enq2.item.id,
    );
    expect(second).toMatchObject({
      kind: "acked",
      mirrorStatus: "already_present",
    });
    expect((await store.listPending()).length).toBe(0);
  });

  it("crash after mirror before ack → relaunch retry → already_present → ack (O2)", async () => {
    const store = createMemoryLocalMirrorOutboxStore();
    const deps = mirrorDeps();
    const enq = await enqueueBeforeMirror({ store }, {
      serverEntryId: ENTRY_ID,
      target: TARGET_A,
    });

    // Simulate mirror success without ack (kill between mirror and ack)
    const mirrored = await (
      await import("@/lib/local-first/journal/secureCopy/mirrorServerJournalEntry")
    ).mirrorServerJournalEntryToLocalGeneration(
      ENTRY_ID,
      deps,
      null,
    );
    expect(mirrored.status).toBe("mirrored");
    expect((await store.listPending()).length).toBe(1);

    const relaunched = reopenMemoryLocalMirrorOutboxStore(store);
    const pending = await relaunched.listPending();
    expect(pending).toHaveLength(1);

    const attempt = await attemptOutboxMirror(
      {
        store: relaunched,
        resolvePinnedGeneration: async () => ({ ok: true, target: TARGET_A }),
        ...createRunMirrorFromPrimitiveDeps(deps),
      },
      pending[0]!.id,
    );
    expect(attempt).toMatchObject({
      kind: "acked",
      mirrorStatus: "already_present",
    });
    expect((await relaunched.listPending()).length).toBe(0);
  });

  it("orchestrateEnqueueThenMirror enqueues before mirror semantics", async () => {
    const store = createMemoryLocalMirrorOutboxStore();
    const deps = mirrorDeps();
    let sawPendingDuringMirror = false;
    const wrapped: MirrorPrimitiveDeps = {
      ...deps,
      fetchEntry: async (id) => {
        const pending = await store.listPending();
        sawPendingDuringMirror = pending.length === 1;
        return deps.fetchEntry(id);
      },
    };
    const result = await orchestrateEnqueueThenMirror(
      {
        store,
        resolvePinnedGeneration: async () => ({ ok: true, target: TARGET_A }),
        ...createRunMirrorFromPrimitiveDeps(wrapped),
      },
      ENTRY_ID,
    );
    expect(result.enqueuedBeforeMirror).toBe(true);
    expect(result.enqueue?.created).toBe(true);
    expect(sawPendingDuringMirror).toBe(true);
    expect(result.attempt.kind).toBe("acked");
  });
});

describe("LocalMirrorOutbox — generation / source policies", () => {
  it("generation drift does not silent-retarget", async () => {
    const store = createMemoryLocalMirrorOutboxStore();
    const enq = await enqueueBeforeMirror({ store }, {
      serverEntryId: ENTRY_ID,
      target: TARGET_A,
    });
    const attempt = await attemptOutboxMirror(
      {
        store,
        resolvePinnedGeneration: async () => ({ ok: true, target: TARGET_B }),
        ...createRunMirrorFromPrimitiveDeps(mirrorDeps()),
      },
      enq.item.id,
    );
    expect(attempt.kind).toBe("retained");
    if (attempt.kind !== "retained") return;
    expect(attempt.lastResult).toBe("generation_changed");
    expect(attempt.detail).toBe("silent_retarget_forbidden");
    expect((await store.listPending()).length).toBe(1);
  });

  it("corrupt / resolve failure is fail-closed (no snapshot fallback open)", async () => {
    const store = createMemoryLocalMirrorOutboxStore();
    const enq = await enqueueBeforeMirror({ store }, {
      serverEntryId: ENTRY_ID,
      target: TARGET_A,
    });
    const attempt = await attemptOutboxMirror(
      {
        store,
        resolvePinnedGeneration: async () => ({
          ok: false,
          reason: "corrupt_manifest",
          detail: "checksum_mismatch",
        }),
        ...createRunMirrorFromPrimitiveDeps(mirrorDeps()),
      },
      enq.item.id,
    );
    expect(attempt.kind).toBe("retained");
    if (attempt.kind !== "retained") return;
    expect(attempt.lastResult).toBe("target_unavailable");
    expect((await store.listPending()).length).toBe(1);
  });

  it("source_changed keeps pending as attention_required", async () => {
    const store = createMemoryLocalMirrorOutboxStore();
    const originalEntry = apiEntry({
      content: "original mirrored body\n\n#WriteThroughTest #テスト",
      updatedAt: "2026-08-12T06:00:00.000Z",
    });
    const depsSeed = mirrorDeps({ entry: originalEntry });
    const enq = await enqueueBeforeMirror({ store }, {
      serverEntryId: ENTRY_ID,
      target: TARGET_A,
    });
    const first = await attemptOutboxMirror(
      {
        store,
        resolvePinnedGeneration: async () => ({ ok: true, target: TARGET_A }),
        ...createRunMirrorFromPrimitiveDeps(depsSeed),
      },
      enq.item.id,
    );
    expect(first.kind).toBe("acked");

    const changed = apiEntry({
      content: "changed body\n\n#WriteThroughTest #テスト",
      updatedAt: "2026-08-12T09:00:00.000Z",
    });
    const depsChanged = mirrorDeps({
      entry: changed,
      repository: depsSeed.repository,
    });
    const enq2 = await enqueueBeforeMirror({ store }, {
      serverEntryId: ENTRY_ID,
      target: TARGET_A,
    });
    const attempt = await attemptOutboxMirror(
      {
        store,
        resolvePinnedGeneration: async () => ({ ok: true, target: TARGET_A }),
        ...createRunMirrorFromPrimitiveDeps(depsChanged),
      },
      enq2.item.id,
    );
    expect(attempt.kind).toBe("retained");
    if (attempt.kind !== "retained") return;
    expect(attempt.lastResult).toBe("attention_required");
    expect(depsChanged.repository.rows[0]?.content).toContain("original mirrored");
    expect((await store.listPending()).length).toBe(1);
  });

  it("source_missing retains pending and does not Local-delete", async () => {
    const store = createMemoryLocalMirrorOutboxStore();
    const deps = mirrorDeps({ entry: null });
    const enq = await enqueueBeforeMirror({ store }, {
      serverEntryId: ENTRY_ID,
      target: TARGET_A,
    });
    const beforeRows = deps.repository.rows.length;
    const attempt = await attemptOutboxMirror(
      {
        store,
        resolvePinnedGeneration: async () => ({ ok: true, target: TARGET_A }),
        ...createRunMirrorFromPrimitiveDeps(deps),
      },
      enq.item.id,
    );
    expect(attempt.kind).toBe("retained");
    if (attempt.kind !== "retained") return;
    expect(attempt.lastResult).toBe("source_missing");
    expect(deps.repository.rows.length).toBe(beforeRows);
    expect((await store.listPending()).length).toBe(1);
  });

  it("retry uses Server GET only — no Server create / donguri", async () => {
    const store = createMemoryLocalMirrorOutboxStore();
    const deps = mirrorDeps();
    await orchestrateEnqueueThenMirror(
      {
        store,
        resolvePinnedGeneration: async () => ({ ok: true, target: TARGET_A }),
        ...createRunMirrorFromPrimitiveDeps(deps),
      },
      ENTRY_ID,
    );
    expect(deps.serverCreateCalls).toBe(0);
    expect(deps.donguriCalls).toBe(0);
  });

  it("targetIdentityMatchesItem and redaction helpers", () => {
    const item: LocalMirrorOutboxItem = {
      id: "1",
      serverEntryId: ENTRY_ID,
      targetGenerationId: opaqueGenerationIdFromResolved(TARGET_A),
      targetDatabaseId: TARGET_A.databaseId,
      targetMediaRootId: TARGET_A.mediaRootId,
      targetSchemaVersion: TARGET_A.schemaVersion,
      manifestChecksumAtEnqueue: TARGET_A.manifestChecksum,
      requestedAt: "t",
      retryCount: 0,
      lastResult: null,
      lastAttemptAt: null,
      createdAt: "t",
    };
    expect(targetIdentityMatchesItem(item, TARGET_A)).toBe(true);
    expect(targetIdentityMatchesItem(item, TARGET_B)).toBe(false);
    const redacted = redactServerEntryIdForLog(ENTRY_ID);
    expect(redacted.includes(ENTRY_ID)).toBe(false);
    expect(redacted).toContain("…");
  });
});
