/**
 * Thin SQLite adapter for Phase 4B-2A PoC only.
 * Uses @capacitor-community/sqlite (community-maintained; SQLCipher-backed even when
 * opened with no-encryption). Not wired to production Journal / Neon.
 */

import { Capacitor } from "@capacitor/core";
import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection,
} from "@capacitor-community/sqlite";

import {
  LOCAL_JOURNAL_POC_DB_NAME,
  LOCAL_JOURNAL_POC_SCHEMA_VERSION,
  type LocalJournalPocRow,
} from "@/lib/local-first/poc/types";

let connection: SQLiteConnection | null = null;
let db: SQLiteDBConnection | null = null;

function assertNative(): void {
  if (!Capacitor.isNativePlatform()) {
    throw new Error(
      "Local-first SQLite PoC is native-only (Capacitor.isNativePlatform() required).",
    );
  }
}

function getConnection(): SQLiteConnection {
  if (!connection) {
    connection = new SQLiteConnection(CapacitorSQLite);
  }
  return connection;
}

export async function openPocDatabase(): Promise<SQLiteDBConnection> {
  assertNative();
  if (db) return db;

  const sqlite = getConnection();
  const consistency = await sqlite.checkConnectionsConsistency();
  const isConn = (await sqlite.isConnection(LOCAL_JOURNAL_POC_DB_NAME, false)).result;

  if (consistency.result && isConn) {
    db = await sqlite.retrieveConnection(LOCAL_JOURNAL_POC_DB_NAME, false);
  } else {
    db = await sqlite.createConnection(
      LOCAL_JOURNAL_POC_DB_NAME,
      false,
      "no-encryption",
      LOCAL_JOURNAL_POC_SCHEMA_VERSION,
      false,
    );
  }

  await db.open();
  await initPocSchema(db);
  return db;
}

async function initPocSchema(database: SQLiteDBConnection): Promise<void> {
  await database.execute(`
    CREATE TABLE IF NOT EXISTS schema_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
  await database.execute(`
    CREATE TABLE IF NOT EXISTS local_journal_poc (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      media_path TEXT
    );
  `);

  const ver = await database.query(
    "SELECT value FROM schema_meta WHERE key = ?;",
    ["schema_version"],
  );
  const current = ver.values?.[0]?.value as string | undefined;
  if (current == null) {
    await database.run(
      "INSERT INTO schema_meta (key, value) VALUES (?, ?);",
      ["schema_version", String(LOCAL_JOURNAL_POC_SCHEMA_VERSION)],
    );
  }
}

export async function insertPocJournal(row: LocalJournalPocRow): Promise<void> {
  const database = await openPocDatabase();
  await database.run(
    `INSERT OR REPLACE INTO local_journal_poc
      (id, title, content, created_at, media_path)
     VALUES (?, ?, ?, ?, ?);`,
    [row.id, row.title, row.content, row.createdAt, row.mediaPath],
  );
}

export async function listPocJournals(): Promise<LocalJournalPocRow[]> {
  const database = await openPocDatabase();
  const result = await database.query(
    `SELECT id, title, content, created_at, media_path
     FROM local_journal_poc
     ORDER BY created_at DESC;`,
  );
  const rows = result.values ?? [];
  return rows.map((r) => ({
    id: String(r.id),
    title: String(r.title),
    content: String(r.content),
    createdAt: String(r.created_at),
    mediaPath: r.media_path == null || r.media_path === "" ? null : String(r.media_path),
  }));
}

export async function clearPocJournals(): Promise<void> {
  const database = await openPocDatabase();
  await database.execute("DELETE FROM local_journal_poc;");
}

export async function closePocDatabase(): Promise<void> {
  if (!db) return;
  const sqlite = getConnection();
  await sqlite.closeConnection(LOCAL_JOURNAL_POC_DB_NAME, false);
  db = null;
}
