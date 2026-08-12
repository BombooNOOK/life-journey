/**
 * In-memory Local Save Operation Intent store (unit / crash fixtures).
 * Unique(saveOperationId) last line of defence.
 */

import type {
  LocalSaveOperationIntentRecord,
  LocalSaveOperationIntentStore,
} from "@/lib/local-first/journal/saveIntent/types";

export function createMemoryLocalSaveOperationIntentStore(
  seed?: LocalSaveOperationIntentRecord[],
): LocalSaveOperationIntentStore & {
  rows: Map<string, LocalSaveOperationIntentRecord>;
} {
  const byOp = new Map<string, LocalSaveOperationIntentRecord>();
  if (seed) {
    for (const row of seed) byOp.set(row.saveOperationId, { ...row });
  }

  return {
    rows: byOp,
    async findBySaveOperationId(saveOperationId) {
      const row = byOp.get(saveOperationId);
      return row ? { ...row } : null;
    },
    async findByActorAndSaveOperationId(actorKey, saveOperationId) {
      const row = byOp.get(saveOperationId);
      if (!row || row.actorKey !== actorKey) return null;
      return { ...row };
    },
    async tryInsert(row) {
      const existing = byOp.get(row.saveOperationId);
      if (existing) return { created: false, row: { ...existing } };
      byOp.set(row.saveOperationId, { ...row });
      return { created: true, row: { ...row } };
    },
    async update(row) {
      if (!byOp.has(row.saveOperationId)) {
        throw new Error("intent_missing");
      }
      byOp.set(row.saveOperationId, { ...row });
      return { ...row };
    },
    async listByActor(actorKey) {
      return [...byOp.values()]
        .filter((r) => r.actorKey === actorKey)
        .map((r) => ({ ...r }))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    async dumpRows() {
      return [...byOp.values()].map((r) => ({ ...r }));
    },
  };
}
