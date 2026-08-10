/**
 * Phase 4B-2A Local-first Storage PoC types.
 * Dummy data only — not production JournalEntry.
 */

export const LOCAL_JOURNAL_POC_SCHEMA_VERSION = 1 as const;

export const LOCAL_JOURNAL_POC_DB_NAME = "ljd_local_first_poc" as const;

/** Library-relative media root (Capacitor Directory.Library) */
export const LOCAL_POC_MEDIA_DIR = "ljd-poc/media" as const;

export type LocalJournalPocRow = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  mediaPath: string | null;
};
