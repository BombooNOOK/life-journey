import { describe, expect, it } from "vitest";

import {
  LocalJournalActivationManifestStore,
  createMemoryManifestFs,
} from "@/lib/local-first/journal/activation/LocalJournalActivationManifestStore";
import {
  ACTIVATION_MANIFEST_FORMAT_VERSION,
  EXPECTED_JOURNAL_SCHEMA_VERSION,
  TECHNICAL_ACTIVE_DATABASE_ID,
  TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
  TECHNICAL_CANDIDATE_GENERATION,
  type ManifestChecksumBody,
} from "@/lib/local-first/journal/activation/types";
import {
  assertDbMediaPairIntegrity,
  mapManifestToResolvedGeneration,
} from "@/lib/local-first/journal/generation/ResolvedLocalJournalGeneration";
import { resolveLocalJournalGenerationTargetWithFs } from "@/lib/local-first/journal/generation/resolveLocalJournalGenerationTarget";
import {
  mirrorExplicitIdToResolvedGenerationWithDeps,
  mirrorExplicitIdViaResolvedGenerationWithFs,
} from "@/lib/local-first/journal/generation/DeveloperResolvedGenerationMirror";
import type { MirrorPrimitiveDeps } from "@/lib/local-first/journal/secureCopy/mirrorServerJournalEntry";
import type {
  CandidateMediaPort,
  JournalRepositoryPort,
} from "@/lib/local-first/journal/secureCopy/types";
import { SECURE_CANDIDATE_MEDIA_ROOT } from "@/lib/local-first/journal/secureCopy/types";
import type { ApiJournalEntry } from "@/lib/local-first/journal/serverFetch";
import type { LocalJournalEntry } from "@/lib/local-first/journal/types";
import { LOCAL_JOURNAL_DB_NAME, LOCAL_JOURNAL_MEDIA_ROOT } from "@/lib/local-first/journal/types";
import { assertNoSecretInText } from "@/lib/local-first/security/noSecretLog";

const PATH = "/tmp/ljd-as/ljd-local-journal-activation.json";

function body(partial?: Partial<ManifestChecksumBody>): ManifestChecksumBody {
  return {
    formatVersion: ACTIVATION_MANIFEST_FORMAT_VERSION,
    generation: TECHNICAL_CANDIDATE_GENERATION,
    activeDatabaseId: TECHNICAL_ACTIVE_DATABASE_ID,
    activeMediaRootId: TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
    previousDatabaseId: null,
    previousMediaRootId: null,
    activationState: "active",
    schemaVersion: EXPECTED_JOURNAL_SCHEMA_VERSION,
    activatedAt: "2026-08-12T08:00:00.000Z",
    ...partial,
  };
}

function apiEntry(id: string): ApiJournalEntry {
  return {
    id,
    content: "resolver integration test\n\n#WriteThroughTest",
    createdAt: "2026-08-12T08:00:00.000Z",
    updatedAt: "2026-08-12T08:00:00.000Z",
    hasPhoto: false,
  };
}

function memoryRepository(): JournalRepositoryPort & { rows: LocalJournalEntry[] } {
  const rows: LocalJournalEntry[] = [];
  return {
    rows,
    async save(entry) {
      rows.push(entry);
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

function createDeps(entryId: string): MirrorPrimitiveDeps & {
  repository: ReturnType<typeof memoryRepository>;
} {
  const repository = memoryRepository();
  let seq = 0;
  return {
    repository,
    media: memoryMedia(),
    fetchEntry: async (id) =>
      id === entryId
        ? { ok: true, entry: apiEntry(entryId) }
        : { ok: false, code: "NOT_FOUND", message: "missing" },
    downloadPhoto: async () => ({ ok: false, message: "no photo" }),
    createStableId: () => `01RGSTABLE${String(++seq).padStart(14, "0")}`,
  };
}

describe("R1 generation target mapping + resolve", () => {
  it("maps valid manifest fields into ResolvedLocalJournalGeneration", () => {
    const mapped = mapManifestToResolvedGeneration({
      generation: 2,
      databaseId: TECHNICAL_ACTIVE_DATABASE_ID,
      mediaRootId: TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
      schemaVersion: 1,
      manifestChecksum: "abc",
    });
    expect(mapped.ok).toBe(true);
    if (mapped.ok) {
      expect(mapped.target.databaseId).toBe(TECHNICAL_ACTIVE_DATABASE_ID);
      expect(mapped.target.mediaRootId).toBe(TECHNICAL_ACTIVE_MEDIA_ROOT_ID);
    }
  });

  it("resolves ready manifest to generation target", async () => {
    const fs = createMemoryManifestFs();
    const written = await LocalJournalActivationManifestStore.writeBodyWithFs(
      PATH,
      body(),
      fs,
    );
    const resolved = await resolveLocalJournalGenerationTargetWithFs({
      fs,
      absolutePath: PATH,
      availableBytes: 5_000_000,
      verifyDatabaseExists: async () => true,
    });
    expect(resolved.ok).toBe(true);
    if (resolved.ok) {
      expect(resolved.target.manifestChecksum).toBe(written.checksum);
      expect(resolved.target.generation).toBe(2);
    }
  });
});

describe("R2/R3 resolved target → mirror / already_present", () => {
  it("mirrors into fixed resolved generation then already_present", async () => {
    const fs = createMemoryManifestFs();
    await LocalJournalActivationManifestStore.writeBodyWithFs(PATH, body(), fs);
    const entryId = "cuid_resolver_mirror_a";
    const deps = createDeps(entryId);
    const first = await mirrorExplicitIdViaResolvedGenerationWithFs({
      serverEntryId: entryId,
      fs,
      absolutePath: PATH,
      deps,
      availableBytes: 5_000_000,
      verifyDatabaseExists: async () => true,
    });
    expect(first.result).toBe("mirrored");
    expect(first.resolvedTarget?.databaseId).toBe(TECHNICAL_ACTIVE_DATABASE_ID);
    expect(deps.repository.rows).toHaveLength(1);

    const second = await mirrorExplicitIdViaResolvedGenerationWithFs({
      serverEntryId: entryId,
      fs,
      absolutePath: PATH,
      deps,
      availableBytes: 5_000_000,
      verifyDatabaseExists: async () => true,
    });
    expect(second.result).toBe("already_present");
    expect(deps.repository.rows).toHaveLength(1);
  });
});

describe("R4-R8 fail-closed guards", () => {
  it("corrupt manifest does not start mirror", async () => {
    const fs = createMemoryManifestFs();
    await fs.atomicReplaceText(PATH, "{bad");
    const deps = createDeps("cuid_x");
    const result = await mirrorExplicitIdViaResolvedGenerationWithFs({
      serverEntryId: "cuid_x",
      fs,
      absolutePath: PATH,
      deps,
      availableBytes: 5_000_000,
    });
    expect(result.result).toBe("blocked");
    expect(result.resolveDeniedReason).toBe("corrupt_manifest");
    expect(deps.repository.rows).toHaveLength(0);
  });

  it("missing DB does not start mirror", async () => {
    const fs = createMemoryManifestFs();
    await LocalJournalActivationManifestStore.writeBodyWithFs(PATH, body(), fs);
    const deps = createDeps("cuid_x");
    const result = await mirrorExplicitIdViaResolvedGenerationWithFs({
      serverEntryId: "cuid_x",
      fs,
      absolutePath: PATH,
      deps,
      availableBytes: 5_000_000,
      verifyDatabaseExists: async () => false,
    });
    expect(result.resolveDeniedReason).toBe("missing_database");
    expect(deps.repository.rows).toHaveLength(0);
  });

  it("plaintext target is rejected", () => {
    const mapped = mapManifestToResolvedGeneration({
      generation: 1,
      databaseId: LOCAL_JOURNAL_DB_NAME,
      mediaRootId: LOCAL_JOURNAL_MEDIA_ROOT,
      schemaVersion: 1,
      manifestChecksum: "x",
    });
    expect(mapped.ok).toBe(false);
    if (!mapped.ok) expect(mapped.reason).toBe("plaintext_forbidden");
  });

  it("wrong media root pairing is rejected", () => {
    expect(() =>
      assertDbMediaPairIntegrity({
        databaseId: TECHNICAL_ACTIVE_DATABASE_ID,
        mediaRootId: LOCAL_JOURNAL_MEDIA_ROOT,
      }),
    ).toThrow();
    const mapped = mapManifestToResolvedGeneration({
      generation: 2,
      databaseId: TECHNICAL_ACTIVE_DATABASE_ID,
      mediaRootId: "ljd/media/other-generation",
      schemaVersion: 1,
      manifestChecksum: "x",
    });
    expect(mapped.ok).toBe(false);
    if (!mapped.ok) expect(mapped.reason).toBe("db_media_pair_mismatch");
  });

  it("capacity unknown refuses resolve/mirror start", async () => {
    const fs = createMemoryManifestFs();
    await LocalJournalActivationManifestStore.writeBodyWithFs(PATH, body(), fs);
    const resolved = await resolveLocalJournalGenerationTargetWithFs({
      fs,
      absolutePath: PATH,
      availableBytes: null,
      verifyDatabaseExists: async () => true,
    });
    expect(resolved.ok).toBe(false);
    if (!resolved.ok) expect(resolved.reason).toBe("capacity_unknown");
  });
});

describe("R9 fixed target per operation + R10 actual DB protection", () => {
  it("keeps start-of-operation target fixed even if manifest checksum changes after", async () => {
    const fs = createMemoryManifestFs();
    const first = await LocalJournalActivationManifestStore.writeBodyWithFs(
      PATH,
      body(),
      fs,
    );
    const entryId = "cuid_fixed_target";
    const deps = createDeps(entryId);
    const target = mapManifestToResolvedGeneration({
      generation: 2,
      databaseId: TECHNICAL_ACTIVE_DATABASE_ID,
      mediaRootId: TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
      schemaVersion: 1,
      manifestChecksum: first.checksum,
    });
    expect(target.ok).toBe(true);
    if (!target.ok) return;

    const result = await mirrorExplicitIdToResolvedGenerationWithDeps({
      serverEntryId: entryId,
      target: target.target,
      deps,
      availableBytes: 5_000_000,
      readChecksumAfter: async () => {
        // Simulate external activation rewrite mid-flight
        const rewritten = await LocalJournalActivationManifestStore.writeBodyWithFs(
          PATH,
          body({ activatedAt: "2026-08-12T09:00:00.000Z" }),
          fs,
        );
        return rewritten.checksum;
      },
    });
    expect(result.result).toBe("mirrored");
    expect(result.resolvedTarget?.manifestChecksum).toBe(first.checksum);
    expect(result.manifestChangedDuringOperation).toBe(true);
    expect(result.resolvedTarget?.databaseId).toBe(TECHNICAL_ACTIVE_DATABASE_ID);
  });

  it("does not target production plaintext DB name", () => {
    expect(TECHNICAL_ACTIVE_DATABASE_ID).not.toBe(LOCAL_JOURNAL_DB_NAME);
    expect(SERVER_COPY_TARGET_SAFE()).toBe(true);
  });

  it("keeps logs free of secrets/content", async () => {
    const fs = createMemoryManifestFs();
    await LocalJournalActivationManifestStore.writeBodyWithFs(PATH, body(), fs);
    const deps = createDeps("cuid_log");
    const result = await mirrorExplicitIdViaResolvedGenerationWithFs({
      serverEntryId: "cuid_log",
      fs,
      absolutePath: PATH,
      deps,
      availableBytes: 5_000_000,
      verifyDatabaseExists: async () => true,
    });
    const text = JSON.stringify(result);
    expect(text).not.toContain("resolver integration test");
    expect(text.toLowerCase()).not.toContain("passphrase");
    expect(() => assertNoSecretInText(text)).not.toThrow();
  });
});

function SERVER_COPY_TARGET_SAFE(): boolean {
  return TECHNICAL_ACTIVE_DATABASE_ID === "ljd_local_journal_secure_candidate";
}
