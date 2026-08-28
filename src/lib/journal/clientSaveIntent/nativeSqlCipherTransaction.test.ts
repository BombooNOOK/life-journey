import { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";

import { canonicalizeExactJournalSavePayload } from "@/lib/journal/clientSaveIntent/exactPayloadCanonical";
import {
  createClientSaveDurableStoreFromSql,
  ensureClientSaveIntentSchema,
  type ClientSaveIntentSqlConnection,
  type ClientSaveIntentSqlSession,
} from "@/lib/journal/clientSaveIntent/clientSaveIntentSqlStore";
import type { ClientSaveOperationIntent } from "@/lib/journal/clientSaveIntent/types";

const OP = "jso_1234567890abcdefghijklmnopqrstuv";
const ACTOR = "operator@ljd.invalid";

const payload = {
  content: "森にあしあと",
  entryDate: "2026-08-18",
  profileId: "profile_fixed_1",
  mood: "calm",
  activity: "record_anyway",
  companionType: "owl",
  designTheme: "simple_plain",
  contentFontMode: "standard",
  includeInBook: true,
};

function preparedIntent(requestFingerprint: string): ClientSaveOperationIntent {
  const now = "2026-08-18T09:00:00.000Z";
  return {
    intentId: "intent_native_tx",
    saveOperationId: OP,
    actorKey: ACTOR,
    stableActorKey: null,
    draftRef: null,
    requestFingerprint,
    status: "prepared",
    serverEntryId: null,
    failureCode: null,
    createdAt: now,
    updatedAt: now,
    lastAttemptAt: null,
    completedAt: null,
  };
}

/**
 * Mimics Capacitor Community SQLite 8.1.1 iOS:
 * execute/run default to wrapping the statement in BEGIN TRANSACTION.
 */
function createCapacitorLikeConnection(options: {
  nativeTransactionApi: boolean;
  failSecondWrite?: boolean;
}): { session: ClientSaveIntentSqlSession; sqlBegins: string[] } {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  let inTransaction = false;
  const sqlBegins: string[] = [];
  let writes = 0;

  const beginPluginTx = (source: "plugin" | "execute-wrap") => {
    if (inTransaction) {
      throw new Error(
        "Execute: Failed in executeSQL : Error: execute failed rc: 1 message: cannot start a transaction within a transaction",
      );
    }
    sqlite.exec("BEGIN TRANSACTION");
    inTransaction = true;
    if (source === "plugin") sqlBegins.push("PLUGIN_BEGIN");
  };
  const commitPluginTx = () => {
    sqlite.exec("COMMIT TRANSACTION");
    inTransaction = false;
  };
  const rollbackPluginTx = () => {
    sqlite.exec("ROLLBACK TRANSACTION");
    inTransaction = false;
  };

  const query = async (sql: string, params: unknown[] = []) => {
    const statement = sqlite.prepare(sql);
    const rows = (
      params.length > 0 ? statement.all(...params) : statement.all()
    ) as Record<string, unknown>[];
    return { values: rows };
  };

  const runUntransacted = async (sql: string, params: unknown[] = []) => {
    writes += 1;
    if (options.failSecondWrite && writes === 2) {
      throw new Error("payload_insert_forced_failure");
    }
    const statement = sqlite.prepare(sql);
    const info = params.length > 0 ? statement.run(...params) : statement.run();
    return { changes: { changes: Number(info.changes ?? 0) } };
  };

  const connection: ClientSaveIntentSqlConnection = {
    query,
    async run(sql, params = []) {
      beginPluginTx("execute-wrap");
      try {
        const result = await runUntransacted(sql, params);
        commitPluginTx();
        return result;
      } catch (error) {
        rollbackPluginTx();
        throw error;
      }
    },
    async execute(statements) {
      beginPluginTx("execute-wrap");
      try {
        if (/^\s*BEGIN\b/i.test(statements)) sqlBegins.push("SQL_BEGIN");
        sqlite.exec(statements);
        commitPluginTx();
      } catch (error) {
        try {
          rollbackPluginTx();
        } catch {
          inTransaction = false;
        }
        throw error;
      }
    },
  };

  if (options.nativeTransactionApi) {
    connection.nativeTransaction = {
      begin: async () => {
        beginPluginTx("plugin");
      },
      commit: async () => {
        commitPluginTx();
      },
      rollback: async () => {
        rollbackPluginTx();
      },
      run: runUntransacted,
    };
  }

  return {
    sqlBegins,
    session: {
      async withDb(fn) {
        await ensureClientSaveIntentSchema(connection);
        return fn(connection);
      },
    },
  };
}

describe("native SQLCipher transaction sequence (Capacitor SQLite 8.1.1)", () => {
  it("fails with nested BEGIN when SQL BEGIN is sent through execute()", async () => {
    const { session } = createCapacitorLikeConnection({ nativeTransactionApi: false });
    const store = createClientSaveDurableStoreFromSql(session);
    const canonical = canonicalizeExactJournalSavePayload({
      saveOperationId: OP,
      payload,
    });
    expect(canonical.ok).toBe(true);
    if (!canonical.ok) return;
    await expect(
      store.persistPreparedIntentWithExactPayload({
        intent: preparedIntent(canonical.requestFingerprint),
        payload,
      }),
    ).rejects.toThrow(/cannot start a transaction within a transaction/);
    expect(await store.findByActorAndSaveOperationId(ACTOR, OP)).toBeNull();
  });

  it("persists intent+payload atomically with plugin begin/commit and no SQL BEGIN", async () => {
    const { session, sqlBegins } = createCapacitorLikeConnection({
      nativeTransactionApi: true,
    });
    const store = createClientSaveDurableStoreFromSql(session);
    const canonical = canonicalizeExactJournalSavePayload({
      saveOperationId: OP,
      payload,
    });
    if (!canonical.ok) return;
    const persisted = await store.persistPreparedIntentWithExactPayload({
      intent: preparedIntent(canonical.requestFingerprint),
      payload,
    });
    expect(persisted.kind).toBe("created");
    const loaded = await store.loadExactPayloadBySaveOperationId(OP);
    expect(loaded.kind).toBe("ok");
    if (loaded.kind !== "ok") return;
    expect(loaded.payload.requestJson).toBe(canonical.requestJson);
    expect(sqlBegins).toEqual(["PLUGIN_BEGIN"]);
    expect(sqlBegins).not.toContain("SQL_BEGIN");
  });

  it("rolls back the intent when payload insert fails inside the native transaction", async () => {
    const { session } = createCapacitorLikeConnection({
      nativeTransactionApi: true,
      failSecondWrite: true,
    });
    const store = createClientSaveDurableStoreFromSql(session);
    const canonical = canonicalizeExactJournalSavePayload({
      saveOperationId: OP,
      payload,
    });
    if (!canonical.ok) return;
    await expect(
      store.persistPreparedIntentWithExactPayload({
        intent: preparedIntent(canonical.requestFingerprint),
        payload,
      }),
    ).rejects.toThrow("payload_insert_forced_failure");
    expect(await store.findByActorAndSaveOperationId(ACTOR, OP)).toBeNull();
    expect(await store.loadExactPayloadBySaveOperationId(OP)).toEqual({ kind: "missing" });
  });

  it("returns already_exists for the same payload and rejects conflicting payloads", async () => {
    const { session } = createCapacitorLikeConnection({ nativeTransactionApi: true });
    const store = createClientSaveDurableStoreFromSql(session);
    const canonical = canonicalizeExactJournalSavePayload({
      saveOperationId: OP,
      payload,
    });
    if (!canonical.ok) return;
    const first = await store.persistPreparedIntentWithExactPayload({
      intent: preparedIntent(canonical.requestFingerprint),
      payload,
    });
    expect(first.kind).toBe("created");
    const duplicate = await store.persistPreparedIntentWithExactPayload({
      intent: preparedIntent(canonical.requestFingerprint),
      payload,
    });
    expect(duplicate.kind).toBe("already_exists");
    const other = canonicalizeExactJournalSavePayload({
      saveOperationId: OP,
      payload: { ...payload, content: "別の本文" },
    });
    expect(other.ok).toBe(true);
    if (!other.ok) return;
    const conflict = await store.persistPreparedIntentWithExactPayload({
      intent: preparedIntent(other.requestFingerprint),
      payload: { ...payload, content: "別の本文" },
    });
    expect(conflict.kind).toBe("payload_conflict");
  });
});
