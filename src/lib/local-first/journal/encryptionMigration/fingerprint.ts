import type { SQLiteDBConnection } from "@capacitor-community/sqlite";

import { LOCAL_JOURNAL_EXPECTED_TABLES } from "@/lib/local-first/journal/database";
import type {
  EntryFingerprint,
  JournalTableInventory,
  MigrationFingerprint,
} from "@/lib/local-first/journal/encryptionMigration/types";

export async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function parseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(String).sort();
  } catch {
    return [];
  }
}

export async function inventoryJournalTables(
  db: SQLiteDBConnection,
): Promise<JournalTableInventory> {
  const versionResult = await db.query("PRAGMA user_version;");
  const raw = versionResult.values?.[0] as Record<string, unknown> | undefined;
  const userVersion = Number(
    raw?.user_version ?? Object.values(raw ?? {})[0] ?? 0,
  );
  const tablesResult = await db.query(
    `SELECT name FROM sqlite_master
     WHERE type='table' AND name NOT LIKE 'sqlite_%'
     ORDER BY name;`,
  );
  const tables = (tablesResult.values ?? []).map((r) => String(r.name));
  const rowCounts: Record<string, number> = {};
  const columns: Record<string, string[]> = {};
  for (const table of tables) {
    const count = await db.query(`SELECT COUNT(*) AS c FROM ${table};`);
    rowCounts[table] = Number(
      (count.values?.[0] as Record<string, unknown> | undefined)?.c ?? 0,
    );
    const info = await db.query(`PRAGMA table_info(${table});`);
    columns[table] = (info.values ?? []).map((r) => String(r.name));
  }
  return { userVersion, tables, rowCounts, columns };
}

export function unexpectedTables(tables: string[]): string[] {
  const expected = new Set<string>(LOCAL_JOURNAL_EXPECTED_TABLES);
  return tables.filter((t) => !expected.has(t));
}

export function missingExpectedTables(tables: string[]): string[] {
  const have = new Set(tables);
  return LOCAL_JOURNAL_EXPECTED_TABLES.filter((t) => !have.has(t));
}

export async function fingerprintJournal(
  db: SQLiteDBConnection,
): Promise<MigrationFingerprint> {
  const inventory = await inventoryJournalTables(db);
  const extra = unexpectedTables(inventory.tables);
  if (extra.length > 0) {
    throw new Error(`unexpected tables: ${extra.join(",")}`);
  }
  const missing = missingExpectedTables(inventory.tables);
  if (missing.length > 0) {
    throw new Error(`missing tables: ${missing.join(",")}`);
  }

  const entryRows = await db.query(
    `SELECT stable_id, legacy_server_id, date_key, content, tags_json
     FROM local_journal_entries
     ORDER BY stable_id;`,
  );
  const mediaRows = await db.query(
    `SELECT stable_id, journal_stable_id, type, relative_path, checksum, mime_type
     FROM local_media
     ORDER BY journal_stable_id, stable_id;`,
  );
  const mediaByJournal = new Map<string, EntryFingerprint["media"]>();
  for (const row of mediaRows.values ?? []) {
    const journalId = String(row.journal_stable_id);
    const list = mediaByJournal.get(journalId) ?? [];
    list.push({
      stableId: String(row.stable_id),
      relativePath: String(row.relative_path),
      type: String(row.type),
      checksum: row.checksum == null ? null : String(row.checksum),
      mimeType: row.mime_type == null ? null : String(row.mime_type),
    });
    mediaByJournal.set(journalId, list);
  }

  const entries: EntryFingerprint[] = [];
  for (const row of entryRows.values ?? []) {
    const content = String(row.content ?? "");
    entries.push({
      stableId: String(row.stable_id),
      legacyServerId:
        row.legacy_server_id == null ? null : String(row.legacy_server_id),
      dateKey: String(row.date_key),
      contentHash: await sha256Hex(content),
      tags: parseTags(String(row.tags_json ?? "[]")),
      media: mediaByJournal.get(String(row.stable_id)) ?? [],
    });
  }

  return {
    userVersion: inventory.userVersion,
    tables: inventory.tables,
    rowCounts: inventory.rowCounts,
    columns: inventory.columns,
    entries,
  };
}

export function compareFingerprints(
  source: MigrationFingerprint,
  target: MigrationFingerprint,
): { ok: boolean; mismatches: string[] } {
  const mismatches: string[] = [];
  if (source.userVersion !== target.userVersion) {
    mismatches.push("user_version");
  }
  if (source.tables.join(",") !== target.tables.join(",")) {
    mismatches.push("tables");
  }
  for (const table of source.tables) {
    const a = (source.columns[table] ?? []).join(",");
    const b = (target.columns[table] ?? []).join(",");
    if (a !== b) mismatches.push(`columns:${table}`);
  }
  for (const table of source.tables) {
    if (source.rowCounts[table] !== target.rowCounts[table]) {
      mismatches.push(`count:${table}`);
    }
  }
  if (source.entries.length !== target.entries.length) {
    mismatches.push("entry_count");
    return { ok: false, mismatches };
  }
  for (let i = 0; i < source.entries.length; i += 1) {
    const a = source.entries[i];
    const b = target.entries[i];
    if (a.stableId !== b.stableId) mismatches.push("stableId");
    if (a.legacyServerId !== b.legacyServerId) mismatches.push("legacyServerId");
    if (a.dateKey !== b.dateKey) mismatches.push("dateKey");
    if (a.contentHash !== b.contentHash) mismatches.push("contentHash");
    if (a.tags.join("\0") !== b.tags.join("\0")) mismatches.push("tags");
    if (JSON.stringify(a.media) !== JSON.stringify(b.media)) {
      mismatches.push("media");
    }
  }
  return { ok: mismatches.length === 0, mismatches: [...new Set(mismatches)] };
}
