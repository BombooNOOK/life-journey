/**
 * Lightweight search over Local Journal SQLite (PoC evaluation for thousands of rows).
 */

import { openLocalJournalDatabase } from "@/lib/local-first/journal/database";
import { JournalRepository } from "@/lib/local-first/journal/repository";
import type { LocalJournalEntry } from "@/lib/local-first/journal/types";

export type LocalJournalSearchQuery = {
  dateKey?: string;
  text?: string;
  tag?: string;
};

export async function searchLocalJournals(
  query: LocalJournalSearchQuery,
): Promise<LocalJournalEntry[]> {
  const db = await openLocalJournalDatabase();
  const params: unknown[] = [];
  const where: string[] = [`e.local_status = 'active'`];

  if (query.dateKey) {
    where.push(`e.date_key = ?`);
    params.push(query.dateKey);
  }

  if (query.text?.trim()) {
    where.push(`(e.title LIKE ? OR e.content LIKE ?)`);
    const like = `%${query.text.trim()}%`;
    params.push(like, like);
  }

  if (query.tag?.trim()) {
    const tag = query.tag.trim().startsWith("#")
      ? query.tag.trim()
      : `#${query.tag.trim()}`;
    where.push(
      `EXISTS (SELECT 1 FROM local_journal_tags_v1 t WHERE t.journal_stable_id = e.stable_id AND t.tag = ?)`,
    );
    params.push(tag);
  }

  const sql = `
    SELECT e.stable_id FROM local_journal_entries_v1 e
    WHERE ${where.join(" AND ")}
    ORDER BY e.date_key DESC, e.created_at DESC
    LIMIT 100;
  `;
  const result = await db.query(sql, params);
  const ids = (result.values ?? []).map((r) => String((r as { stable_id: string }).stable_id));
  const out: LocalJournalEntry[] = [];
  for (const id of ids) {
    const entry = await JournalRepository.getById(id);
    if (entry) out.push(entry);
  }
  return out;
}
