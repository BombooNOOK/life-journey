/**
 * Maps Server/Web JournalEntry-like shape → LocalJournalEntry (no Neon I/O).
 */

import { createLocalStableId } from "@/lib/local-first/journal/stableId";
import type {
  LocalJournalEntry,
  LocalMediaRef,
  ServerJournalEntryLike,
} from "@/lib/local-first/journal/types";
import { LOCAL_JOURNAL_SCHEMA_USER_VERSION } from "@/lib/local-first/journal/types";

export type MapServerJournalOptions = {
  /** Pre-created local stable ids (tests). Defaults generate new ULID-ish ids. */
  journalStableId?: string;
  mediaStableId?: string;
  mediaRelativePath?: string | null;
  mediaChecksum?: string | null;
  importedAt?: string;
  source?: LocalJournalEntry["source"];
};

export function mapServerJournalEntryLikeToLocal(
  server: ServerJournalEntryLike,
  options: MapServerJournalOptions = {},
): LocalJournalEntry {
  const now = new Date().toISOString();
  const journalStableId = options.journalStableId ?? createLocalStableId();
  const mediaRefs: LocalMediaRef[] = [];

  const hasPhotoHint =
    Boolean(server.photoBlobUrl) ||
    Boolean(server.photoBlobPathname) ||
    Boolean(server.photoDataUrl) ||
    Boolean(options.mediaRelativePath);

  if (hasPhotoHint && options.mediaRelativePath) {
    mediaRefs.push({
      stableId: options.mediaStableId ?? createLocalStableId(),
      journalStableId,
      type: "image",
      relativePath: options.mediaRelativePath,
      createdAt: server.createdAt,
      checksum: options.mediaChecksum ?? null,
      mimeType: server.photoMimeType,
    });
  }

  return {
    stableId: journalStableId,
    dateKey: server.dateKey,
    title: server.title.trim() || "無題のあしあと",
    content: server.content,
    createdAt: server.createdAt,
    updatedAt: server.updatedAt,
    tags: normalizeTags(server.tags),
    mediaRefs,
    schemaVersion: LOCAL_JOURNAL_SCHEMA_USER_VERSION,
    source: options.source ?? "mapped_server_shape",
    localStatus: "active",
    importedAt: options.importedAt ?? now,
    legacyServerId: server.id,
    serverUpdatedAt: server.updatedAt,
  };
}

function normalizeTags(tags: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of tags) {
    const t = raw.trim();
    if (!t) continue;
    const withHash = t.startsWith("#") ? t : `#${t}`;
    if (seen.has(withHash)) continue;
    seen.add(withHash);
    out.push(withHash);
  }
  return out;
}
