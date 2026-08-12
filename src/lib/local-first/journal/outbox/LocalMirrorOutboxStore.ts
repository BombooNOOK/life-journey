/**
 * Outbox persistence port + in-memory implementation (unit / crash-window fixtures).
 */

import { isPlaintextProductionDatabaseId } from "@/lib/local-first/journal/generation/ResolvedLocalJournalGeneration";
import {
  opaqueGenerationIdFromResolved,
  type EnqueueInput,
  type EnqueueResult,
  type LocalMirrorOutboxItem,
  type OutboxLastResult,
} from "@/lib/local-first/journal/outbox/types";

export type LocalMirrorOutboxStore = {
  enqueue(input: EnqueueInput): Promise<EnqueueResult>;
  getById(id: string): Promise<LocalMirrorOutboxItem | null>;
  findByServerAndGeneration(
    serverEntryId: string,
    targetGenerationId: string,
  ): Promise<LocalMirrorOutboxItem | null>;
  listPending(): Promise<LocalMirrorOutboxItem[]>;
  updateAttempt(input: {
    id: string;
    lastResult: OutboxLastResult;
    lastAttemptAt: string;
    incrementRetry: boolean;
  }): Promise<LocalMirrorOutboxItem>;
  ackRemove(id: string): Promise<boolean>;
  /** Test / PoC: dump all rows (no secrets expected). */
  dumpRows(): Promise<LocalMirrorOutboxItem[]>;
};

function assertEnqueueTarget(input: EnqueueInput): void {
  if (!input.serverEntryId.trim()) {
    throw new Error("serverEntryId_required");
  }
  if (isPlaintextProductionDatabaseId(input.target.databaseId)) {
    throw new Error("plaintext_forbidden");
  }
}

function newId(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function createMemoryLocalMirrorOutboxStore(
  seed?: LocalMirrorOutboxItem[],
): LocalMirrorOutboxStore & {
  /** Shared backing map — reopen shares this to simulate kill/relaunch. */
  rows: Map<string, LocalMirrorOutboxItem>;
} {
  const rows = new Map<string, LocalMirrorOutboxItem>();
  if (seed) {
    for (const item of seed) rows.set(item.id, { ...item });
  }

  const uniqueKey = (serverEntryId: string, targetGenerationId: string) =>
    `${serverEntryId}\0${targetGenerationId}`;

  const byUnique = new Map<string, string>();
  for (const item of rows.values()) {
    byUnique.set(uniqueKey(item.serverEntryId, item.targetGenerationId), item.id);
  }

  const store: LocalMirrorOutboxStore & {
    rows: Map<string, LocalMirrorOutboxItem>;
  } = {
    rows,
    async enqueue(input) {
      assertEnqueueTarget(input);
      const targetGenerationId = opaqueGenerationIdFromResolved(input.target);
      const key = uniqueKey(input.serverEntryId, targetGenerationId);
      const existingId = byUnique.get(key);
      if (existingId) {
        const existing = rows.get(existingId)!;
        return { item: { ...existing }, created: false };
      }
      const now = input.now ?? new Date().toISOString();
      const item: LocalMirrorOutboxItem = {
        id: input.id ?? newId(),
        serverEntryId: input.serverEntryId,
        targetGenerationId,
        targetDatabaseId: input.target.databaseId,
        targetMediaRootId: input.target.mediaRootId,
        targetSchemaVersion: input.target.schemaVersion,
        manifestChecksumAtEnqueue: input.target.manifestChecksum,
        requestedAt: now,
        retryCount: 0,
        lastResult: null,
        lastAttemptAt: null,
        createdAt: now,
      };
      rows.set(item.id, item);
      byUnique.set(key, item.id);
      return { item: { ...item }, created: true };
    },
    async getById(id) {
      const item = rows.get(id);
      return item ? { ...item } : null;
    },
    async findByServerAndGeneration(serverEntryId, targetGenerationId) {
      const id = byUnique.get(uniqueKey(serverEntryId, targetGenerationId));
      if (!id) return null;
      return { ...rows.get(id)! };
    },
    async listPending() {
      return [...rows.values()]
        .map((r) => ({ ...r }))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    async updateAttempt(input) {
      const current = rows.get(input.id);
      if (!current) throw new Error("outbox_item_missing");
      const next: LocalMirrorOutboxItem = {
        ...current,
        lastResult: input.lastResult,
        lastAttemptAt: input.lastAttemptAt,
        retryCount: input.incrementRetry
          ? current.retryCount + 1
          : current.retryCount,
      };
      rows.set(input.id, next);
      return { ...next };
    },
    async ackRemove(id) {
      const item = rows.get(id);
      if (!item) return false;
      byUnique.delete(uniqueKey(item.serverEntryId, item.targetGenerationId));
      rows.delete(id);
      return true;
    },
    async dumpRows() {
      return [...rows.values()].map((r) => ({ ...r }));
    },
  };
  return store;
}

/**
 * Reopen helper: new store handle over the same durable rows (crash relaunch).
 */
export function reopenMemoryLocalMirrorOutboxStore(
  previous: { rows: Map<string, LocalMirrorOutboxItem> },
): ReturnType<typeof createMemoryLocalMirrorOutboxStore> {
  return createMemoryLocalMirrorOutboxStore([...previous.rows.values()]);
}
