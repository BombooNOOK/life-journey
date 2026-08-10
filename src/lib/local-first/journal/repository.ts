/**
 * Thin Local Journal Repository (PoC). UI does not call SQLite plugin directly.
 */

import { openLocalJournalDatabase } from "@/lib/local-first/journal/database";
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

async function loadMediaForJournal(journalStableId: string): Promise<LocalMediaRef[]> {
  const db = await openLocalJournalDatabase();
  const result = await db.query(
    `SELECT stable_id, journal_stable_id, type, relative_path, created_at, checksum, mime_type
     FROM local_media_v1 WHERE journal_stable_id = ?;`,
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

function mapEntryRow(r: Record<string, unknown>, mediaRefs: LocalMediaRef[]): LocalJournalEntry {
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
  };
}

export const JournalRepository = {
  async save(entry: LocalJournalEntry): Promise<void> {
    const db = await openLocalJournalDatabase();
    await db.run(
      `INSERT OR REPLACE INTO local_journal_entries_v1 (
        stable_id, date_key, title, content, created_at, updated_at,
        tags_json, schema_version, source, local_status, imported_at, legacy_server_id
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?);`,
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
      ],
    );

    await db.run(`DELETE FROM local_journal_tags_v1 WHERE journal_stable_id = ?;`, [
      entry.stableId,
    ]);
    for (const tag of entry.tags) {
      await db.run(
        `INSERT OR REPLACE INTO local_journal_tags_v1 (journal_stable_id, tag) VALUES (?, ?);`,
        [entry.stableId, tag],
      );
    }

    await db.run(`DELETE FROM local_media_v1 WHERE journal_stable_id = ?;`, [entry.stableId]);
    for (const media of entry.mediaRefs) {
      await db.run(
        `INSERT OR REPLACE INTO local_media_v1 (
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
  },

  async getById(stableId: string): Promise<LocalJournalEntry | null> {
    const db = await openLocalJournalDatabase();
    const result = await db.query(
      `SELECT * FROM local_journal_entries_v1 WHERE stable_id = ? AND local_status = 'active' LIMIT 1;`,
      [stableId],
    );
    const row = result.values?.[0] as Record<string, unknown> | undefined;
    if (!row) return null;
    const media = await loadMediaForJournal(stableId);
    return mapEntryRow(row, media);
  },

  async list(): Promise<LocalJournalEntry[]> {
    const db = await openLocalJournalDatabase();
    const result = await db.query(
      `SELECT * FROM local_journal_entries_v1
       WHERE local_status = 'active'
       ORDER BY date_key DESC, created_at DESC;`,
    );
    const rows = result.values ?? [];
    const out: LocalJournalEntry[] = [];
    for (const row of rows) {
      const r = row as Record<string, unknown>;
      const media = await loadMediaForJournal(String(r.stable_id));
      out.push(mapEntryRow(r, media));
    }
    return out;
  },

  async count(): Promise<number> {
    const db = await openLocalJournalDatabase();
    const result = await db.query(
      `SELECT COUNT(*) AS c FROM local_journal_entries_v1 WHERE local_status = 'active';`,
    );
    const row = result.values?.[0] as Record<string, unknown> | undefined;
    return Number(row?.c ?? 0);
  },

  /**
   * PoC cleanup — deletes active PoC / fixture journals and related media rows.
   * Does not touch production Neon.
   */
  async deletePocData(): Promise<string[]> {
    const db = await openLocalJournalDatabase();
    const listed = await this.list();
    const relativePaths: string[] = [];
    for (const entry of listed) {
      for (const m of entry.mediaRefs) relativePaths.push(m.relativePath);
      await db.run(`DELETE FROM local_media_v1 WHERE journal_stable_id = ?;`, [entry.stableId]);
      await db.run(`DELETE FROM local_journal_tags_v1 WHERE journal_stable_id = ?;`, [
        entry.stableId,
      ]);
      await db.run(`DELETE FROM local_journal_entries_v1 WHERE stable_id = ?;`, [entry.stableId]);
    }
    return relativePaths;
  },
};
