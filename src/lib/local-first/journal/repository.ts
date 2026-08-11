/**
 * Local Journal Repository foundation. UI / Web save paths do not call this
 * unless an explicit native Local-first flow invokes it.
 */

import {
  openLocalJournalDatabase,
  withLocalJournalTransaction,
} from "@/lib/local-first/journal/database";
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
    serverUpdatedAt: r.server_updated_at == null ? null : String(r.server_updated_at),
  };
}

export const JournalRepository = {
  async save(entry: LocalJournalEntry): Promise<void> {
    await withLocalJournalTransaction(async (db) => {
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
    });
  },

  async getById(stableId: string): Promise<LocalJournalEntry | null> {
    const db = await openLocalJournalDatabase();
    const result = await db.query(
      `SELECT * FROM local_journal_entries WHERE stable_id = ? AND local_status = 'active' LIMIT 1;`,
      [stableId],
    );
    const row = result.values?.[0] as Record<string, unknown> | undefined;
    if (!row) return null;
    return mapEntryRow(row, await loadMediaForJournal(stableId));
  },

  async getByLegacyServerId(legacyServerId: string): Promise<LocalJournalEntry | null> {
    const db = await openLocalJournalDatabase();
    const result = await db.query(
      `SELECT * FROM local_journal_entries
       WHERE legacy_server_id = ? AND local_status = 'active' LIMIT 1;`,
      [legacyServerId],
    );
    const row = result.values?.[0] as Record<string, unknown> | undefined;
    if (!row) return null;
    return mapEntryRow(row, await loadMediaForJournal(String(row.stable_id)));
  },

  /** @deprecated Prefer getByLegacyServerId */
  async findByLegacyServerId(legacyServerId: string): Promise<LocalJournalEntry | null> {
    return this.getByLegacyServerId(legacyServerId);
  },

  async list(): Promise<LocalJournalEntry[]> {
    const db = await openLocalJournalDatabase();
    const result = await db.query(
      `SELECT * FROM local_journal_entries
       WHERE local_status = 'active'
       ORDER BY date_key DESC, created_at DESC;`,
    );
    const out: LocalJournalEntry[] = [];
    for (const row of result.values ?? []) {
      const r = row as Record<string, unknown>;
      out.push(mapEntryRow(r, await loadMediaForJournal(String(r.stable_id))));
    }
    return out;
  },

  async count(): Promise<number> {
    const db = await openLocalJournalDatabase();
    const result = await db.query(
      `SELECT COUNT(*) AS c FROM local_journal_entries WHERE local_status = 'active';`,
    );
    const row = result.values?.[0] as Record<string, unknown> | undefined;
    return Number(row?.c ?? 0);
  },

  /**
   * Diagnostics / test cleanup only — deletes all local journal rows + returns media paths.
   * Does not touch Neon / Blob.
   */
  async deleteAll(): Promise<string[]> {
    const listed = await this.list();
    const relativePaths: string[] = [];
    await withLocalJournalTransaction(async (db) => {
      for (const entry of listed) {
        for (const m of entry.mediaRefs) relativePaths.push(m.relativePath);
        await db.run(`DELETE FROM local_media WHERE journal_stable_id = ?;`, [entry.stableId]);
        await db.run(`DELETE FROM local_journal_tags WHERE journal_stable_id = ?;`, [
          entry.stableId,
        ]);
        await db.run(`DELETE FROM local_journal_entries WHERE stable_id = ?;`, [entry.stableId]);
      }
    });
    return relativePaths;
  },

  /** @deprecated Prefer deleteAll */
  async deletePocData(): Promise<string[]> {
    return this.deleteAll();
  },
};
