/**
 * Local Journal Repository foundation. UI / Web save paths do not call this
 * unless an explicit native Local-first flow invokes it.
 *
 * Always bound to plaintext ljd_local_journal. Do not retarget to the
 * encrypted candidate from this module.
 */

import {
  openLocalJournalDatabase,
  withLocalJournalTransaction,
} from "@/lib/local-first/journal/database";
import {
  countActiveEntriesSql,
  getJournalByIdSql,
  getJournalByLegacyServerIdSql,
  loadMediaForJournal,
  mapEntryRow,
  saveJournalEntrySql,
} from "@/lib/local-first/journal/journalRepositorySql";
import type { LocalJournalEntry } from "@/lib/local-first/journal/types";

export const JournalRepository = {
  async save(entry: LocalJournalEntry): Promise<void> {
    await withLocalJournalTransaction(async (db) => {
      await saveJournalEntrySql(db, entry);
    });
  },

  async getById(stableId: string): Promise<LocalJournalEntry | null> {
    const db = await openLocalJournalDatabase();
    return getJournalByIdSql(db, stableId);
  },

  async getByLegacyServerId(legacyServerId: string): Promise<LocalJournalEntry | null> {
    const db = await openLocalJournalDatabase();
    return getJournalByLegacyServerIdSql(db, legacyServerId);
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
      out.push(mapEntryRow(r, await loadMediaForJournal(db, String(r.stable_id))));
    }
    return out;
  },

  async count(): Promise<number> {
    const db = await openLocalJournalDatabase();
    return countActiveEntriesSql(db);
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
