/**
 * Generation registry persistence port + in-memory implementation.
 */

import {
  isPlaintextActualDatabaseId,
  isValidLifecycleState,
  isValidSchemaVersion,
  legacyAliasFromManifestGeneration,
  REGISTRY_FORMAT_VERSION,
  type GenerationIntegrityStatus,
  type GenerationLifecycleState,
  type GenerationRegistryRow,
  type InitializeCandidateResult,
} from "@/lib/local-first/journal/registry/types";

export type LocalGenerationRegistryStore = {
  exists(): Promise<boolean>;
  listAll(): Promise<GenerationRegistryRow[]>;
  findByGenerationId(generationId: string): Promise<GenerationRegistryRow | null>;
  findByDatabaseId(databaseId: string): Promise<GenerationRegistryRow | null>;
  findByPair(
    databaseId: string,
    mediaRootId: string,
  ): Promise<GenerationRegistryRow | null>;
  countByLifecycleState(state: GenerationLifecycleState): Promise<number>;
  initializeCurrentCandidate(input: {
    databaseId: string;
    mediaRootId: string;
    schemaVersion: number;
    lifecycleState: GenerationLifecycleState;
    integrityStatus: GenerationIntegrityStatus;
    legacyGenerationAlias: string | null;
    activatedAt?: string | null;
    now?: string;
    generationId?: string;
  }): Promise<InitializeCandidateResult>;
};

function newGenerationId(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return `gen_${[...arr].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

function assertCandidateInput(input: {
  databaseId: string;
  mediaRootId: string;
  schemaVersion: number;
  lifecycleState: GenerationLifecycleState;
}): void {
  if (!input.databaseId.trim() || !input.mediaRootId.trim()) {
    throw new Error("pair_required");
  }
  if (isPlaintextActualDatabaseId(input.databaseId)) {
    throw new Error("plaintext_forbidden");
  }
  if (!isValidSchemaVersion(input.schemaVersion)) {
    throw new Error("invalid_schema_version");
  }
  if (!isValidLifecycleState(input.lifecycleState)) {
    throw new Error("invalid_lifecycle_state");
  }
}

export function createMemoryLocalGenerationRegistryStore(
  seed?: GenerationRegistryRow[],
): LocalGenerationRegistryStore & {
  rows: Map<string, GenerationRegistryRow>;
} {
  const rows = new Map<string, GenerationRegistryRow>();
  const byDatabaseId = new Map<string, string>();
  const byPair = new Map<string, string>();

  const pairKey = (databaseId: string, mediaRootId: string) =>
    `${databaseId}\0${mediaRootId}`;

  if (seed) {
    for (const row of seed) {
      rows.set(row.generationId, { ...row });
      byDatabaseId.set(row.databaseId, row.generationId);
      byPair.set(pairKey(row.databaseId, row.mediaRootId), row.generationId);
    }
  }

  const store: LocalGenerationRegistryStore & {
    rows: Map<string, GenerationRegistryRow>;
  } = {
    rows,
    async exists() {
      return rows.size > 0;
    },
    async listAll() {
      return [...rows.values()].map((r) => ({ ...r }));
    },
    async findByGenerationId(generationId) {
      const row = rows.get(generationId);
      return row ? { ...row } : null;
    },
    async findByDatabaseId(databaseId) {
      const id = byDatabaseId.get(databaseId);
      if (!id) return null;
      return { ...rows.get(id)! };
    },
    async findByPair(databaseId, mediaRootId) {
      const id = byPair.get(pairKey(databaseId, mediaRootId));
      if (!id) return null;
      return { ...rows.get(id)! };
    },
    async countByLifecycleState(state) {
      return [...rows.values()].filter((r) => r.lifecycleState === state).length;
    },
    async initializeCurrentCandidate(input) {
      assertCandidateInput(input);
      const existing = await this.findByPair(input.databaseId, input.mediaRootId);
      if (existing) {
        return { row: existing, created: false };
      }
      const existingDb = await this.findByDatabaseId(input.databaseId);
      if (existingDb) {
        throw new Error("database_id_duplicate");
      }
      const now = input.now ?? new Date().toISOString();
      const row: GenerationRegistryRow = {
        generationId: input.generationId ?? newGenerationId(),
        databaseId: input.databaseId,
        mediaRootId: input.mediaRootId,
        schemaVersion: input.schemaVersion,
        lifecycleState: input.lifecycleState,
        integrityStatus: input.integrityStatus,
        legacyGenerationAlias:
          input.legacyGenerationAlias ??
          legacyAliasFromManifestGeneration(2),
        createdAt: now,
        activatedAt: input.activatedAt ?? null,
        previousAt: null,
        retiredAt: null,
        quarantinedAt: null,
        registryFormatVersion: REGISTRY_FORMAT_VERSION,
      };
      rows.set(row.generationId, row);
      byDatabaseId.set(row.databaseId, row.generationId);
      byPair.set(pairKey(row.databaseId, row.mediaRootId), row.generationId);
      return { row: { ...row }, created: true };
    },
  };

  return store;
}

export function reopenMemoryLocalGenerationRegistryStore(
  previous: { rows: Map<string, GenerationRegistryRow> },
): ReturnType<typeof createMemoryLocalGenerationRegistryStore> {
  return createMemoryLocalGenerationRegistryStore([...previous.rows.values()]);
}
