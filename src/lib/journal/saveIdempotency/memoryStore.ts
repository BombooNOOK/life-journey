/**
 * Memory store for 4B-4N unit PoC.
 * Emulates unique(userId, saveOperationId) as the last line of defence.
 */

import type {
  JournalSaveOperationRecord,
  JournalSaveOperationStore,
  SaveOperationId,
} from "@/lib/journal/saveIdempotency/types";

function key(userId: string, saveOperationId: SaveOperationId): string {
  return `${userId}\0${saveOperationId}`;
}

export function createMemoryJournalSaveOperationStore(): JournalSaveOperationStore & {
  /** Test helper: all rows (no content). */
  listAll(): JournalSaveOperationRecord[];
} {
  const byKey = new Map<string, JournalSaveOperationRecord>();
  let seq = 0;

  return {
    listAll() {
      return [...byKey.values()];
    },
    async findByUserAndOperationId(userId, saveOperationId) {
      return byKey.get(key(userId, saveOperationId)) ?? null;
    },
    async tryInsertClaim(row) {
      const k = key(row.userId, row.saveOperationId);
      const existing = byKey.get(k);
      if (existing) {
        return { created: false, row: existing };
      }
      const created: JournalSaveOperationRecord = {
        ...row,
        id: row.id ?? `op_mem_${++seq}`,
      };
      byKey.set(k, created);
      return { created: true, row: created };
    },
    async update(row) {
      const k = key(row.userId, row.saveOperationId);
      if (!byKey.has(k)) {
        throw new Error("operation_missing");
      }
      byKey.set(k, row);
      return row;
    },
    async compareAndSet(input) {
      const k = key(input.userId, input.saveOperationId);
      const current = byKey.get(k) ?? null;
      if (!current) return { ok: false, row: null };
      if (current.checkpoint !== input.expectedCheckpoint) {
        return { ok: false, row: current };
      }
      if (
        input.expectedJournalEntryId !== undefined &&
        current.journalEntryId !== input.expectedJournalEntryId
      ) {
        return { ok: false, row: current };
      }
      const next: JournalSaveOperationRecord = {
        ...current,
        ...input.patch,
        userId: current.userId,
        saveOperationId: current.saveOperationId,
        id: current.id,
        createdAt: current.createdAt,
      };
      byKey.set(k, next);
      return { ok: true, row: next };
    },
  };
}
