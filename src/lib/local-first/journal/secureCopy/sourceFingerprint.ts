import { sha256HexOfUtf8 } from "@/lib/local-first/journal/checksum";
import { normalizeTag } from "@/lib/local-first/journal/secureCopy/testEntryGuard";
import type { SourceFingerprint } from "@/lib/local-first/journal/secureCopy/types";
import type { LocalJournalEntry } from "@/lib/local-first/journal/types";

export async function buildSourceFingerprint(input: {
  legacyServerId: string;
  serverUpdatedAt: string;
  content: string;
  tags: string[];
  photoHash: string | null;
  mediaCount: number;
}): Promise<SourceFingerprint> {
  return {
    legacyServerId: input.legacyServerId,
    serverUpdatedAt: input.serverUpdatedAt,
    contentHash: await sha256HexOfUtf8(input.content),
    tags: input.tags.map(normalizeTag).filter(Boolean),
    photoHash: input.photoHash,
    mediaCount: input.mediaCount,
  };
}

export async function fingerprintFromLocalEntry(
  entry: LocalJournalEntry,
): Promise<SourceFingerprint> {
  return buildSourceFingerprint({
    legacyServerId: entry.legacyServerId ?? "",
    serverUpdatedAt: entry.serverUpdatedAt ?? "",
    content: entry.content,
    tags: entry.tags,
    photoHash: entry.mediaRefs[0]?.checksum ?? null,
    mediaCount: entry.mediaRefs.length,
  });
}

function sameTagSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((tag, i) => tag === right[i]);
}

/**
 * Compare incoming Server fingerprint to an existing Local row.
 * Photo hash is compared only when both sides have one (rerun may skip re-download).
 */
export function sourceFingerprintChanged(
  existing: SourceFingerprint,
  incoming: SourceFingerprint,
): boolean {
  if (existing.legacyServerId !== incoming.legacyServerId) return true;
  if (existing.serverUpdatedAt !== incoming.serverUpdatedAt) return true;
  if (existing.contentHash !== incoming.contentHash) return true;
  if (!sameTagSet(existing.tags, incoming.tags)) return true;
  if (
    existing.photoHash &&
    incoming.photoHash &&
    existing.photoHash !== incoming.photoHash
  ) {
    return true;
  }
  if (incoming.photoHash != null && existing.mediaCount !== incoming.mediaCount) {
    return true;
  }
  return false;
}
