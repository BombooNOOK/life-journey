import type {
  ClientSaveDurableStore,
  ClientSaveOperationIntent,
} from "@/lib/journal/clientSaveIntent/types";
import { assertClientSaveOperationIntentTransition } from "@/lib/journal/clientSaveIntent/lifecycle";
import {
  applyDeleteExactPayloadIfCompleted,
  applyPersistPreparedIntentWithExactPayload,
  verifyLoadedExactPayload,
  type ClientSaveExactPayloadRecord,
  type DeleteExactPayloadResult,
} from "@/lib/journal/clientSaveIntent/durableExactPayload";

export function createMemoryClientSaveOperationIntentStore(
  options: {
    failPayloadInsert?: boolean;
    backing?: {
      rows: Map<string, ClientSaveOperationIntent>;
      payloads: Map<string, ClientSaveExactPayloadRecord>;
      tombstones: Map<string, { actorKey: string; createdAt: string; updatedAt: string }>;
    };
  } = {},
): ClientSaveDurableStore {
  const rows = options.backing?.rows ?? new Map<string, ClientSaveOperationIntent>();
  const payloads = options.backing?.payloads ?? new Map<string, ClientSaveExactPayloadRecord>();
  const tombstones =
    options.backing?.tombstones ??
    new Map<string, { actorKey: string; createdAt: string; updatedAt: string }>();

  function snapshot() {
    return {
      intents: new Map(rows),
      payloads: new Map(payloads),
    };
  }

  function restore(snap: ReturnType<typeof snapshot>) {
    rows.clear();
    payloads.clear();
    for (const [key, value] of snap.intents) rows.set(key, value);
    for (const [key, value] of snap.payloads) payloads.set(key, value);
  }

  const tx = {
    async findIntent(saveOperationId: string) {
      const row = rows.get(saveOperationId);
      return row ? { ...row } : null;
    },
    async insertIntent(intent: ClientSaveOperationIntent) {
      rows.set(intent.saveOperationId, { ...intent });
    },
    async findPayload(saveOperationId: string) {
      const row = payloads.get(saveOperationId);
      return row ? { ...row } : null;
    },
    async insertPayload(row: ClientSaveExactPayloadRecord) {
      if (options.failPayloadInsert) throw new Error("payload_insert_forced_failure");
      payloads.set(row.saveOperationId, { ...row });
    },
  };

  const store: ClientSaveDurableStore = {
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
      const existing = rows.get(intent.saveOperationId);
      if (!existing || existing.actorKey !== intent.actorKey) throw new Error("intent_missing");
      assertClientSaveOperationIntentTransition(existing.status, intent.status);
      rows.set(intent.saveOperationId, { ...intent });
      return { ...intent };
    },
    async listRecoverableByActor(actorKey) {
      return [...rows.values()]
        .filter(
          (row) =>
            row.actorKey === actorKey &&
            row.stableActorKey == null &&
            (row.status === "prepared" ||
              row.status === "awaiting_result" ||
              row.status === "server_completed" ||
              row.status === "recovery_required"),
        )
        .map((row) => ({ ...row }));
    },
    async listRecoverableByStableActorKey(stableActorKey) {
      return [...rows.values()]
        .filter(
          (row) =>
            row.stableActorKey === stableActorKey &&
            (row.status === "prepared" ||
              row.status === "awaiting_result" ||
              row.status === "server_completed" ||
              row.status === "recovery_required"),
        )
        .map((row) => ({ ...row }));
    },
    async findByStableActorAndSaveOperationId(stableActorKey, saveOperationId) {
      const row = rows.get(saveOperationId);
      return row?.stableActorKey === stableActorKey ? { ...row } : null;
    },
    async deleteByActor(actorKey) {
      let count = 0;
      for (const [id, row] of [...rows]) {
        if (row.actorKey === actorKey) {
          rows.delete(id);
          payloads.delete(id);
          count += 1;
        }
      }
      return count;
    },
    async getDeletionTombstone(actorKey) {
      const tombstone = tombstones.get(actorKey);
      return tombstone ? { ...tombstone } : null;
    },
    async writeDeletionTombstone(actorKey, now) {
      const existing = tombstones.get(actorKey);
      tombstones.set(actorKey, {
        actorKey,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      });
    },
    async clearDeletionTombstone(actorKey) {
      tombstones.delete(actorKey);
    },
    async persistPreparedIntentWithExactPayload(input) {
      const snap = snapshot();
      try {
        return await applyPersistPreparedIntentWithExactPayload(tx, input);
      } catch (error) {
        restore(snap);
        throw error;
      }
    },
    async loadExactPayloadBySaveOperationId(saveOperationId) {
      const payload = payloads.get(saveOperationId);
      if (!payload) return { kind: "missing" as const };
      const intent = rows.get(saveOperationId);
      return verifyLoadedExactPayload({ ...payload }, intent?.requestFingerprint);
    },
    async deleteExactPayloadBySaveOperationId(input) {
      return applyDeleteExactPayloadIfCompleted(
        {
          findIntent: async (id) => {
            const row = rows.get(id);
            return row ? { ...row } : null;
          },
          findPayload: async (id) => {
            const row = payloads.get(id);
            return row ? { ...row } : null;
          },
          deletePayload: async (id) => {
            payloads.delete(id);
          },
        },
        input,
      );
    },
    async cleanupCompletedExactPayloadsForActor(actorKey) {
      const ids = [...payloads.keys()].filter((id) => {
        const intent = rows.get(id);
        return (
          intent?.actorKey === actorKey &&
          intent.status === "completed" &&
          Boolean(intent.serverEntryId)
        );
      });
      let deleted = 0;
      const results: DeleteExactPayloadResult[] = [];
      for (const saveOperationId of ids) {
        const result = await store.deleteExactPayloadBySaveOperationId({
          actorKey,
          saveOperationId,
        });
        results.push(result);
        if (result.kind === "deleted") deleted += 1;
      }
      return { attempted: ids.length, deleted, results };
    },
  };
  return store;
}
