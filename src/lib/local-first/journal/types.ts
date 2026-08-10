/**
 * Phase 4B-2B Local Journal domain types (PoC).
 * Not a copy of Prisma JournalEntry. Dummy / fixture only.
 */

export const LOCAL_JOURNAL_REPO_DB_NAME = "ljd_local_journal_repo" as const;

/** SQLite PRAGMA user_version for this PoC schema */
export const LOCAL_JOURNAL_SCHEMA_USER_VERSION = 1 as const;

/** Filesystem root under Directory.Library (relative, never absolute device paths) */
export const LOCAL_JOURNAL_MEDIA_ROOT = "ljd/media/journal" as const;

export type LocalMediaType = "image" | "video" | "other";

export type LocalMediaRef = {
  stableId: string;
  journalStableId: string;
  type: LocalMediaType;
  /** Relative to LJD Library management root (e.g. ljd/media/journal/...) */
  relativePath: string;
  createdAt: string;
  checksum: string | null;
  mimeType: string | null;
};

export type LocalJournalEntry = {
  stableId: string;
  /** YYYY-MM-DD (Japan calendar day when known) */
  dateKey: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  mediaRefs: LocalMediaRef[];
  schemaVersion: number;
  /** Optional provenance */
  source: "fixture" | "mapped_server_shape" | "local_poc";
  localStatus: "active" | "deleted_poc";
  importedAt: string | null;
  /** Former Neon cuid when known — never the permanent cross-device identity alone */
  legacyServerId: string | null;
};

/**
 * Server / Web JournalEntry-like shape for mapper tests.
 * Includes PoC display fields (title/dateKey/tags) that Neon row may lack.
 */
export type ServerJournalEntryLike = {
  id: string;
  createdAt: string;
  updatedAt: string;
  email: string;
  profileId: string;
  content: string;
  mood: string;
  activity: string;
  companionType: string;
  designTheme: string;
  contentFontMode: string;
  photoDataUrl: string | null;
  photoBlobUrl: string | null;
  photoBlobPathname: string | null;
  photoMimeType: string | null;
  photoSizeBytes: number | null;
  photoStorageProvider: string | null;
  generatedComment: string | null;
  includeInBook: boolean;
  /** PoC / mapping aids (not all live on Prisma row today) */
  dateKey: string;
  title: string;
  tags: string[];
};
