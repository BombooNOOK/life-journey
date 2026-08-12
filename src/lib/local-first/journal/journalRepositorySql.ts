/**
 * SQL operations for Local Journal tables. Connection is supplied by caller.
 * Production repository keeps ljd_local_journal. Candidate copy supplies
 * the encrypted candidate connection explicitly.
 */

import type { SQLiteDBConnection } from "@capacitor-community/sqlite";

import type { LocalJournalEntry, LocalMediaRef } from "@/lib/local-first/journal/types";

function parseTagsJson(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(String);
  } catch {
    return [];
  }
}

export async function loadMediaForJournal(
  db: SQLiteDBConnection,
  journalStableId: string,
): Promise<LocalMediaRef[]> {
  const result = await db.query(
    `SELECT stable_id, journal_stable_id, type, relative_path, created_at, checksum, mime_type
     FROM local_media WHERE journal_stable_id = ?;`,
    [journalStableId],
  );
  return (result.values ?? []).map((r) => ({
    stableId: String(r.stable_id),
    journalStableId: String(r.journal_stable_id),
    type: String(r.type) as LocalMediaRef["type"],
    relativePath: String(r.relative_path),
    createdAt: String(r.created_at),
    checksum: r.checksum == null ? null : String(r.checksum),
    mimeType: r.mime_type == null ? null : String(r.mime_type),
  }));
}

export function mapEntryRow(
  r: Record<string, unknown>,
  mediaRefs: LocalMediaRef[],
): LocalJournalEntry {
  return {
    stableId: String(r.stable_id),
    dateKey: String(r.date_key),
    title: String(r.title),
    content: String(r.content),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
    tags: parseTagsJson(String(r.tags_json ?? "[]")),
    mediaRefs,
    schemaVersion: Number(r.schema_version),
    source: String(r.source) as LocalJournalEntry["source"],
    localStatus: String(r.local_status) as LocalJournalEntry["localStatus"],
    importedAt: r.imported_at == null ? null : String(r.imported_at),
    legacyServerId: r.legacy_server_id == null ? null : String(r.legacy_server_id),
    serverUpdatedAt: r.server_updated_at == null ? null : String(r.server_updated_at),
  };
}

export async function saveJournalEntrySql(
  db: SQLiteDBConnection,
  entry: LocalJournalEntry,
): Promise<void> {
  await db.run(
    `INSERT OR REPLACE INTO local_journal_entries (
      stable_id, date_key, title, content, created_at, updated_at,
      tags_json, schema_version, source, local_status, imported_at, legacy_server_id,
      server_updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?);`,
    [
      entry.stableId,
      entry.dateKey,
      entry.title,
      entry.content,
      entry.createdAt,
      entry.updatedAt,
      JSON.stringify(entry.tags),
      entry.schemaVersion,
      entry.source,
      entry.localStatus,
      entry.importedAt,
      entry.legacyServerId,
      entry.serverUpdatedAt,
    ],
  );

  await db.run(`DELETE FROM local_journal_tags WHERE journal_stable_id = ?;`, [
    entry.stableId,
  ]);
  for (const tag of entry.tags) {
    await db.run(
      `INSERT OR REPLACE INTO local_journal_tags (journal_stable_id, tag) VALUES (?, ?);`,
      [entry.stableId, tag],
    );
  }

  await db.run(`DELETE FROM local_media WHERE journal_stable_id = ?;`, [entry.stableId]);
  for (const media of entry.mediaRefs) {
    await db.run(
      `INSERT OR REPLACE INTO local_media (
        stable_id, journal_stable_id, type, relative_path, created_at, checksum, mime_type
      ) VALUES (?,?,?,?,?,?,?);`,
      [
        media.stableId,
        media.journalStableId,
        media.type,
        media.relativePath,
        media.createdAt,
        media.checksum,
        media.mimeType,
      ],
    );
  }
}

export async function getJournalByIdSql(
  db: SQLiteDBConnection,
  stableId: string,
): Promise<LocalJournalEntry | null> {
  const result = await db.query(
    `SELECT * FROM local_journal_entries WHERE stable_id = ? AND local_status = 'active' LIMIT 1;`,
    [stableId],
  );
  const row = result.values?.[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  return mapEntryRow(row, await loadMediaForJournal(db, stableId));
}

export async function getJournalByLegacyServerIdSql(
  db: SQLiteDBConnection,
  legacyServerId: string,
): Promise<LocalJournalEntry | null> {
  const result = await db.query(
    `SELECT * FROM local_journal_entries
     WHERE legacy_server_id = ? AND local_status = 'active' LIMIT 1;`,
    [legacyServerId],
  );
  const row = result.values?.[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  return mapEntryRow(row, await loadMediaForJournal(db, String(row.stable_id)));
}

export async function countActiveEntriesSql(db: SQLiteDBConnection): Promise<number> {
  const result = await db.query(
    `SELECT COUNT(*) AS c FROM local_journal_entries WHERE local_status = 'active';`,
  );
  const row = result.values?.[0] as Record<string, unknown> | undefined;
  return Number(row?.c ?? 0);
}

export async function countTagsSql(db: SQLiteDBConnection): Promise<number> {
  const result = await db.query(`SELECT COUNT(*) AS c FROM local_journal_tags;`);
  const row = result.values?.[0] as Record<string, unknown> | undefined;
  return Number(row?.c ?? 0);
}

export async function countMediaSql(db: SQLiteDBConnection): Promise<number> {
  const result = await db.query(`SELECT COUNT(*) AS c FROM local_media;`);
  const row = result.values?.[0] as Record<string, unknown> | undefined;
  return Number(row?.c ?? 0);
}
