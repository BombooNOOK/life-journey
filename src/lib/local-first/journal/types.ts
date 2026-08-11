/**
 * Local-first Journal foundation types (Phase 4B-2D).
 * Device-primary domain model — not a Prisma JournalEntry copy.
 */

/** Capacitor SQLite database name (Library/CapacitorDatabase). */
export const LOCAL_JOURNAL_DB_NAME = "ljd_local_journal" as const;

/**
 * PRAGMA user_version for the foundation schema.
 * 4B-2A/2B/2C PoC DBs used other names/versions and are not auto-merged.
 */
export const LOCAL_JOURNAL_SCHEMA_USER_VERSION = 1 as const;

/** Filesystem root under Directory.Library (relative paths only in DB). */
export const LOCAL_JOURNAL_MEDIA_ROOT = "ljd/media/journal" as const;

export type LocalMediaType = "image" | "video" | "other";

export type LocalMediaRef = {
  stableId: string;
  journalStableId: string;
  type: LocalMediaType;
  /** Relative to Library management root (e.g. ljd/media/journal/...). */
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
  source: "mapped_server_shape" | "migrated_server" | "local";
  localStatus: "active" | "deleted";
  importedAt: string | null;
  /** Former Neon cuid when known — never the sole cross-device identity. */
  legacyServerId: string | null;
  /** Server updatedAt retained for future conflict detection (not authority). */
  serverUpdatedAt: string | null;
};

/**
 * Server / Web JournalEntry-like shape for mapper / migration helpers.
 * Includes display aids (title/dateKey/tags) that may be derived client-side.
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
  dateKey: string;
  title: string;
  tags: string[];
};
