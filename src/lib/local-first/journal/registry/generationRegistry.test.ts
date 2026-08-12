import { describe, expect, it } from "vitest";

import {
  attachManifestChecksum,
} from "@/lib/local-first/journal/activation/manifestCanonical";
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
import { resolveLocalJournalGenerationTargetWithRegistryValidationWithFs } from "@/lib/local-first/journal/registry/resolveWithRegistryValidation";
import {
  createMemoryLocalGenerationRegistryStore,
  reopenMemoryLocalGenerationRegistryStore,
} from "@/lib/local-first/journal/registry/LocalGenerationRegistryStore";
import {
  canRetireGeneration,
  countOutstandingOutboxForDatabaseId,
  validateActiveUniqueness,
  validateLifecycleTransition,
  validateRegistryRoutingState,
} from "@/lib/local-first/journal/registry/generationRegistryValidation";
import {
  legacyAliasFromManifestGeneration,
  MANIFEST_STORAGE_GENERATION_ORDINAL,
  REGISTRY_CANDIDATE_DATABASE_ID,
  REGISTRY_CANDIDATE_MEDIA_ROOT_ID,
  REGISTRY_FORBIDDEN_PERSISTED_KEYS,
  REGISTRY_FORMAT_VERSION,
  type GenerationRegistryRow,
} from "@/lib/local-first/journal/registry/types";
import {
  validateManifestRegistryPair,
  validateRegistryForManifestTarget,
} from "@/lib/local-first/journal/registry/validateRegistryForResolve";
import type { LocalMirrorOutboxItem } from "@/lib/local-first/journal/outbox/types";
import type { ResolvedLocalJournalGeneration } from "@/lib/local-first/journal/generation/ResolvedLocalJournalGeneration";
import { LOCAL_JOURNAL_DB_NAME, LOCAL_JOURNAL_MEDIA_ROOT } from "@/lib/local-first/journal/types";
import { assertNoSecretInText } from "@/lib/local-first/security/noSecretLog";

const PATH = "/tmp/ljd-as/ljd-local-journal-activation.json";

function manifestBody(partial?: Partial<ManifestChecksumBody>): ManifestChecksumBody {
  return {
    formatVersion: ACTIVATION_MANIFEST_FORMAT_VERSION,
    generation: TECHNICAL_CANDIDATE_GENERATION,
    activeDatabaseId: TECHNICAL_ACTIVE_DATABASE_ID,
    activeMediaRootId: TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
    previousDatabaseId: null,
    previousMediaRootId: null,
    activationState: "active",
    schemaVersion: EXPECTED_JOURNAL_SCHEMA_VERSION,
    activatedAt: "2026-08-12T10:00:00.000Z",
    ...partial,
  };
}

function resolvedTarget(
  partial?: Partial<ResolvedLocalJournalGeneration>,
): ResolvedLocalJournalGeneration {
  return {
    generation: TECHNICAL_CANDIDATE_GENERATION,
    databaseId: TECHNICAL_ACTIVE_DATABASE_ID,
    mediaRootId: TECHNICAL_ACTIVE_MEDIA_ROOT_ID,
    schemaVersion: EXPECTED_JOURNAL_SCHEMA_VERSION,
    manifestChecksum: "checksum_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    ...partial,
  };
}

function registryRow(
  partial?: Partial<GenerationRegistryRow>,
): GenerationRegistryRow {
  const now = "2026-08-12T10:00:00.000Z";
  return {
    generationId: "gen_0123456789abcdef0123456789abcdef",
    databaseId: REGISTRY_CANDIDATE_DATABASE_ID,
    mediaRootId: REGISTRY_CANDIDATE_MEDIA_ROOT_ID,
    schemaVersion: EXPECTED_JOURNAL_SCHEMA_VERSION,
    lifecycleState: "technical_active",
    integrityStatus: "ok",
    legacyGenerationAlias: legacyAliasFromManifestGeneration(
      MANIFEST_STORAGE_GENERATION_ORDINAL,
    ),
    createdAt: now,
    activatedAt: now,
    previousAt: null,
    retiredAt: null,
    quarantinedAt: null,
    registryFormatVersion: REGISTRY_FORMAT_VERSION,
    ...partial,
  };
}

async function writeManifest(
  fs: ReturnType<typeof createMemoryManifestFs>,
  body: ManifestChecksumBody,
) {
  const withChecksum = await attachManifestChecksum(body);
  await fs.atomicReplaceText(PATH, JSON.stringify(withChecksum));
  return withChecksum;
}

describe("manifest generation identity audit", () => {
  it("manifest generation is storage ordinal — not registry generationId", () => {
    expect(typeof TECHNICAL_CANDIDATE_GENERATION).toBe("number");
    expect(legacyAliasFromManifestGeneration(TECHNICAL_CANDIDATE_GENERATION)).toBe(
      "manifest-generation:2",
    );
    expect(legacyAliasFromManifestGeneration(2)).not.toMatch(/^gen_/);
  });
});

describe("LocalGenerationRegistry — initialize / idempotency / persistence", () => {
  it("first initialize creates one row with opaque generationId", async () => {
    const store = createMemoryLocalGenerationRegistryStore();
    const result = await store.initializeCurrentCandidate({
      databaseId: REGISTRY_CANDIDATE_DATABASE_ID,
      mediaRootId: REGISTRY_CANDIDATE_MEDIA_ROOT_ID,
      schemaVersion: EXPECTED_JOURNAL_SCHEMA_VERSION,
      lifecycleState: "technical_active",
      integrityStatus: "ok",
      legacyGenerationAlias: legacyAliasFromManifestGeneration(2),
      activatedAt: "2026-08-12T10:00:00.000Z",
    });
    expect(result.created).toBe(true);
    expect(result.row.generationId.startsWith("gen_")).toBe(true);
    expect(result.row.legacyGenerationAlias).toBe("manifest-generation:2");
    expect(result.row.databaseId).toBe(REGISTRY_CANDIDATE_DATABASE_ID);
    expect((await store.listAll()).length).toBe(1);
  });

  it("duplicate initialize is idempotent", async () => {
    const store = createMemoryLocalGenerationRegistryStore();
    const a = await store.initializeCurrentCandidate({
      databaseId: REGISTRY_CANDIDATE_DATABASE_ID,
      mediaRootId: REGISTRY_CANDIDATE_MEDIA_ROOT_ID,
      schemaVersion: EXPECTED_JOURNAL_SCHEMA_VERSION,
      lifecycleState: "technical_active",
      integrityStatus: "ok",
      legacyGenerationAlias: legacyAliasFromManifestGeneration(2),
    });
    const b = await store.initializeCurrentCandidate({
      databaseId: REGISTRY_CANDIDATE_DATABASE_ID,
      mediaRootId: REGISTRY_CANDIDATE_MEDIA_ROOT_ID,
      schemaVersion: EXPECTED_JOURNAL_SCHEMA_VERSION,
      lifecycleState: "technical_active",
      integrityStatus: "ok",
      legacyGenerationAlias: legacyAliasFromManifestGeneration(2),
    });
    expect(b.created).toBe(false);
    expect(b.row.generationId).toBe(a.row.generationId);
    expect((await store.listAll()).length).toBe(1);
  });

  it("persists after reopen", async () => {
    const store = createMemoryLocalGenerationRegistryStore();
    await store.initializeCurrentCandidate({
      databaseId: REGISTRY_CANDIDATE_DATABASE_ID,
      mediaRootId: REGISTRY_CANDIDATE_MEDIA_ROOT_ID,
      schemaVersion: EXPECTED_JOURNAL_SCHEMA_VERSION,
      lifecycleState: "technical_active",
      integrityStatus: "ok",
      legacyGenerationAlias: legacyAliasFromManifestGeneration(2),
    });
    const reopened = reopenMemoryLocalGenerationRegistryStore(store);
    expect((await reopened.listAll()).length).toBe(1);
  });

  it("rejects plaintext actual DB registration", async () => {
    const store = createMemoryLocalGenerationRegistryStore();
    await expect(
      store.initializeCurrentCandidate({
        databaseId: LOCAL_JOURNAL_DB_NAME,
        mediaRootId: LOCAL_JOURNAL_MEDIA_ROOT,
        schemaVersion: EXPECTED_JOURNAL_SCHEMA_VERSION,
        lifecycleState: "ready",
        integrityStatus: "ok",
        legacyGenerationAlias: null,
      }),
    ).rejects.toThrow(/plaintext/);
  });

  it("does not persist forbidden content/secret fields", async () => {
    const store = createMemoryLocalGenerationRegistryStore();
    await store.initializeCurrentCandidate({
      databaseId: REGISTRY_CANDIDATE_DATABASE_ID,
      mediaRootId: REGISTRY_CANDIDATE_MEDIA_ROOT_ID,
      schemaVersion: EXPECTED_JOURNAL_SCHEMA_VERSION,
      lifecycleState: "technical_active",
      integrityStatus: "ok",
      legacyGenerationAlias: legacyAliasFromManifestGeneration(2),
    });
    const dumped = JSON.stringify(await store.listAll());
    for (const key of REGISTRY_FORBIDDEN_PERSISTED_KEYS) {
      expect(dumped.includes(`"${key}"`)).toBe(false);
    }
    assertNoSecretInText(dumped);
  });
});

describe("registry validation G1–G7 fixtures", () => {
  const manifest = async () => {
    const fs = createMemoryManifestFs();
    const m = await writeManifest(fs, manifestBody());
    return { fs, manifest: m };
  };

  it("G1 manifest B + registry B technical_active → ready", async () => {
    const { fs, manifest: m } = await manifest();
    const registry = createMemoryLocalGenerationRegistryStore([
      registryRow({ lifecycleState: "technical_active" }),
    ]);
    const result = await resolveLocalJournalGenerationTargetWithRegistryValidationWithFs({
      fs,
      absolutePath: PATH,
      registryStore: registry,
      manifest: m,
      availableBytes: 5_000_000,
      verifyDatabaseExists: async () => true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.registryRow.lifecycleState).toBe("technical_active");
    }
  });

  it("G2 manifest B / registry missing → fail-closed", async () => {
    const { fs, manifest: m } = await manifest();
    const registry = createMemoryLocalGenerationRegistryStore();
    const result = await validateRegistryForManifestTarget(
      registry,
      m,
      resolvedTarget(),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("registry_missing");
  });

  it("G3 DB pair mismatch → fail-closed", () => {
    const row = registryRow({ databaseId: "ljd_wrong_db" });
    const pair = validateManifestRegistryPair(manifestBody(), row);
    expect(pair.ok).toBe(false);
    if (!pair.ok) expect(pair.reason).toBe("registry_pair_mismatch");
  });

  it("G4 media pair mismatch → fail-closed", () => {
    const row = registryRow({ mediaRootId: "ljd/media/wrong" });
    const pair = validateManifestRegistryPair(manifestBody(), row);
    expect(pair.ok).toBe(false);
    if (!pair.ok) expect(pair.reason).toBe("registry_pair_mismatch");
  });

  it("G5 registry quarantined → fail-closed", async () => {
    const { manifest: m } = await manifest();
    const registry = createMemoryLocalGenerationRegistryStore([
      registryRow({ lifecycleState: "quarantined" }),
    ]);
    const result = await validateRegistryForManifestTarget(
      registry,
      m,
      resolvedTarget(),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("registry_quarantined");
  });

  it("G6 registry retired → fail-closed", async () => {
    const { manifest: m } = await manifest();
    const registry = createMemoryLocalGenerationRegistryStore([
      registryRow({ lifecycleState: "retired" }),
    ]);
    const result = await validateRegistryForManifestTarget(
      registry,
      m,
      resolvedTarget(),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("registry_retired");
  });

  it("G7 multiple technical_active → fail-closed", async () => {
    const { manifest: m } = await manifest();
    const registry = createMemoryLocalGenerationRegistryStore([
      registryRow({ generationId: "gen_a", lifecycleState: "technical_active" }),
      registryRow({
        generationId: "gen_b",
        databaseId: "ljd_local_journal_secure_candidate_b",
        mediaRootId: "ljd/media/journal-secure-candidate-b",
        lifecycleState: "technical_active",
      }),
    ]);
    const result = await validateRegistryForManifestTarget(
      registry,
      m,
      resolvedTarget(),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("registry_multiple_active");
  });
});

describe("routing state / transitions / retirement guard", () => {
  it("allows only technical_active for routing", () => {
    expect(validateRegistryRoutingState(registryRow()).ok).toBe(true);
    expect(
      validateRegistryRoutingState(registryRow({ lifecycleState: "previous" })).ok,
    ).toBe(false);
    expect(
      validateRegistryRoutingState(registryRow({ lifecycleState: "ready" })).ok,
    ).toBe(false);
  });

  it("validates lifecycle transitions (fixture)", () => {
    expect(validateLifecycleTransition("staged", "ready").ok).toBe(true);
    expect(validateLifecycleTransition("ready", "technical_active").ok).toBe(true);
    expect(validateLifecycleTransition("technical_active", "previous").ok).toBe(true);
    expect(validateLifecycleTransition("previous", "retirement_blocked").ok).toBe(true);
    expect(validateLifecycleTransition("technical_active", "retired").ok).toBe(false);
  });

  it("blocks retirement when outstanding outbox > 0", () => {
    const row = registryRow({ lifecycleState: "previous" });
    expect(canRetireGeneration({ row, outstandingOutboxCount: 1 }).ok).toBe(false);
    expect(canRetireGeneration({ row, outstandingOutboxCount: 0 }).ok).toBe(true);
  });

  it("blocks retirement when active or quarantined", () => {
    expect(
      canRetireGeneration({
        row: registryRow({ lifecycleState: "technical_active" }),
        outstandingOutboxCount: 0,
      }).ok,
    ).toBe(false);
    expect(
      canRetireGeneration({
        row: registryRow({ lifecycleState: "quarantined" }),
        outstandingOutboxCount: 0,
      }).ok,
    ).toBe(false);
  });

  it("derives outstanding outbox count from outbox items", () => {
    const items: LocalMirrorOutboxItem[] = [
      {
        id: "1",
        serverEntryId: "e1",
        targetGenerationId: REGISTRY_CANDIDATE_DATABASE_ID,
        targetDatabaseId: REGISTRY_CANDIDATE_DATABASE_ID,
        targetMediaRootId: REGISTRY_CANDIDATE_MEDIA_ROOT_ID,
        targetSchemaVersion: 1,
        manifestChecksumAtEnqueue: "x",
        requestedAt: "t",
        retryCount: 0,
        lastResult: "retry_needed",
        lastAttemptAt: "t",
        createdAt: "t",
      },
      {
        id: "2",
        serverEntryId: "e2",
        targetGenerationId: REGISTRY_CANDIDATE_DATABASE_ID,
        targetDatabaseId: REGISTRY_CANDIDATE_DATABASE_ID,
        targetMediaRootId: REGISTRY_CANDIDATE_MEDIA_ROOT_ID,
        targetSchemaVersion: 1,
        manifestChecksumAtEnqueue: "x",
        requestedAt: "t",
        retryCount: 0,
        lastResult: "mirrored",
        lastAttemptAt: "t",
        createdAt: "t",
      },
    ];
    expect(countOutstandingOutboxForDatabaseId(items, REGISTRY_CANDIDATE_DATABASE_ID)).toBe(
      1,
    );
  });

  it("active uniqueness validator", () => {
    expect(
      validateActiveUniqueness([
        registryRow({ lifecycleState: "technical_active" }),
      ]).ok,
    ).toBe(true);
    expect(
      validateActiveUniqueness([
        registryRow({ generationId: "a", lifecycleState: "technical_active" }),
        registryRow({
          generationId: "b",
          databaseId: "db_b",
          mediaRootId: "media_b",
          lifecycleState: "technical_active",
        }),
      ]).ok,
    ).toBe(false);
  });
});
