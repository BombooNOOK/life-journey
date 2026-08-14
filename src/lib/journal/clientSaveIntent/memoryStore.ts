import type {
  ClientSaveOperationIntent,
  ClientSaveOperationIntentStore,
} from "@/lib/journal/clientSaveIntent/types";

export function createMemoryClientSaveOperationIntentStore(): ClientSaveOperationIntentStore {
  const rows = new Map<string, ClientSaveOperationIntent>();
  return {
    async findByActorAndSaveOperationId(actorKey, saveOperationId) {
      const row = rows.get(saveOperationId);
      return row?.actorKey === actorKey ? { ...row } : null;
    },
    async tryInsert(intent) {
      const existing = rows.get(intent.saveOperationId);
      if (existing) return { created: false, intent: { ...existing } };
      rows.set(intent.saveOperationId, { ...intent });
      return { created: true, intent: { ...intent } };
    },
    async update(intent) {
      if (!rows.has(intent.saveOperationId)) throw new Error("intent_missing");
      rows.set(intent.saveOperationId, { ...intent });
      return { ...intent };
    },
    async listRecoverableByActor(actorKey) {
      return [...rows.values()]
        .filter(
          (row) =>
            row.actorKey === actorKey &&
            (row.status === "prepared" ||
              row.status === "awaiting_result" ||
              row.status === "server_completed" ||
              row.status === "recovery_required"),
        )
        .map((row) => ({ ...row }));
    },
    async deleteByActor(actorKey) {
      let count = 0;
      for (const [id, row] of rows) {
        if (row.actorKey === actorKey) {
          rows.delete(id);
          count += 1;
        }
      }
      return count;
    },
  };
}
