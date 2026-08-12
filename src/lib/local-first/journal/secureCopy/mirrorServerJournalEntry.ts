/**
 * Shared low-level primitive: mirror one Server-canonical journal entry
 * into the encrypted Local candidate generation.
 *
 * Used by:
 * - historical multi-copy (4B-4B)
 * - Server-authoritative write-through mirror PoC (4B-4E)
 *
 * Never writes/deletes Server. Never targets ljd_local_journal.
 */

import { sha256HexOfBase64 } from "@/lib/local-first/journal/checksum";
import { mapServerJournalEntryLikeToLocal } from "@/lib/local-first/journal/mapper";
import {
  apiJournalToServerLike,
  journalEntryNeedsPhoto,
  type ApiJournalEntry,
} from "@/lib/local-first/journal/serverFetch";
import {
  buildSourceFingerprint,
  fingerprintFromLocalEntry,
  sourceFingerprintChanged,
} from "@/lib/local-first/journal/secureCopy/sourceFingerprint";
import { hasTestPurposeTag } from "@/lib/local-first/journal/secureCopy/testEntryGuard";
import type {
  CandidateMediaPort,
  JournalRepositoryPort,
  MirrorEntryResult,
  SourceFingerprint,
} from "@/lib/local-first/journal/secureCopy/types";
import { safeErrorMessage } from "@/lib/local-first/security";

export type MirrorPrimitiveDeps = {
  fetchEntry: (id: string) => Promise<
    | { ok: true; entry: ApiJournalEntry }
    | { ok: false; code: string; message: string }
  >;
  downloadPhoto: (
    id: string,
    fallback?: string | null,
  ) => Promise<
    | { ok: true; base64: string; byteLength: number; mimeType: string }
    | { ok: false; message: string }
  >;
  repository: JournalRepositoryPort;
  media: CandidateMediaPort;
  createStableId: () => string;
  /**
   * Developer-only Local failure injection.
   * Server fetch still runs; Local save/media is forced to fail.
   * Never rolls back Server (GET-only).
   */
  injectLocalFailure?: "save" | "media_write" | false;
};

function failResult(serverId: string, detail: string): MirrorEntryResult {
  return {
    status: "failed",
    serverId,
    stableId: null,
    legacyServerId: null,
    detail,
    fingerprint: null,
    serverFetched: false,
    needsRetry: false,
  };
}

/**
 * Mirror one explicit Server entry into the Local encrypted generation.
 * Input: Server cuid + deps bound to candidate repository/media.
 */
export async function mirrorServerJournalEntryToLocalGeneration(
  serverId: string,
  deps: MirrorPrimitiveDeps,
  availableBytes: number | null,
): Promise<MirrorEntryResult> {
  const fetched = await deps.fetchEntry(serverId);
  if (!fetched.ok) {
    return failResult(serverId, fetched.message);
  }
  const apiEntry = fetched.entry;
  const serverLike = apiJournalToServerLike(apiEntry);
  if (!hasTestPurposeTag(serverLike.tags)) {
    return {
      status: "failed",
      serverId,
      stableId: null,
      legacyServerId: null,
      detail: "not_test_entry",
      fingerprint: null,
      serverFetched: true,
      needsRetry: false,
    };
  }

  const existing = await deps.repository.getByLegacyServerId(apiEntry.id);
  const incomingMeta = await buildSourceFingerprint({
    legacyServerId: apiEntry.id,
    serverUpdatedAt: apiEntry.updatedAt,
    content: apiEntry.content,
    tags: serverLike.tags,
    photoHash: existing?.mediaRefs[0]?.checksum ?? null,
    mediaCount: journalEntryNeedsPhoto(apiEntry) ? 1 : 0,
  });

  if (existing) {
    const existingFp = await fingerprintFromLocalEntry(existing);
    if (sourceFingerprintChanged(existingFp, incomingMeta)) {
      return {
        status: "source_changed",
        serverId,
        stableId: existing.stableId,
        legacyServerId: existing.legacyServerId,
        detail: "source_changed_no_overwrite",
        fingerprint: incomingMeta,
        serverFetched: true,
        needsRetry: false,
      };
    }
    return {
      status: "already_present",
      serverId,
      stableId: existing.stableId,
      legacyServerId: existing.legacyServerId,
      detail: "legacyServerId already present; left untouched",
      fingerprint: existingFp,
      serverFetched: true,
      needsRetry: false,
    };
  }

  let photoBase64: string | null = null;
  let photoBytes = 0;
  let photoMime: string | null = null;
  let photoHash: string | null = null;
  if (journalEntryNeedsPhoto(apiEntry)) {
    const photo = await deps.downloadPhoto(apiEntry.id, apiEntry.photoDataUrl);
    if (!photo.ok) {
      return {
        status: "failed",
        serverId,
        stableId: null,
        legacyServerId: apiEntry.id,
        detail: photo.message,
        fingerprint: null,
        serverFetched: true,
        needsRetry: true,
      };
    }
    if (
      availableBytes != null &&
      photo.byteLength > 0 &&
      photo.byteLength > availableBytes
    ) {
      return {
        status: "failed",
        serverId,
        stableId: null,
        legacyServerId: apiEntry.id,
        detail: "insufficient_free_space",
        fingerprint: null,
        serverFetched: true,
        needsRetry: true,
      };
    }
    photoBase64 = photo.base64;
    photoBytes = photo.byteLength;
    photoMime = photo.mimeType;
    photoHash = await sha256HexOfBase64(photo.base64);
  }

  const journalStableId = deps.createStableId();
  const mediaStableId = deps.createStableId();
  let relativePath: string | null = null;
  try {
    if (deps.injectLocalFailure === "media_write") {
      throw new Error("injected_local_media_write_failure");
    }

    if (photoBase64 && photoHash) {
      const ext = photoMime?.includes("png")
        ? "png"
        : photoMime?.includes("webp")
          ? "webp"
          : "jpg";
      relativePath = await deps.media.write(
        `${journalStableId}-${mediaStableId}.${ext}`,
        photoBase64,
      );
      const written = await deps.media.readBase64(relativePath);
      const verify = await sha256HexOfBase64(written);
      if (verify !== photoHash) {
        await deps.media.delete(relativePath);
        relativePath = null;
        return {
          status: "failed",
          serverId,
          stableId: null,
          legacyServerId: apiEntry.id,
          detail: "photo_checksum_mismatch",
          fingerprint: null,
          serverFetched: true,
          needsRetry: true,
        };
      }
    }

    if (deps.injectLocalFailure === "save") {
      throw new Error("injected_local_save_failure");
    }

    if (photoMime) serverLike.photoMimeType = photoMime;
    if (photoBytes) serverLike.photoSizeBytes = photoBytes;

    const local = mapServerJournalEntryLikeToLocal(serverLike, {
      journalStableId,
      mediaStableId: relativePath ? mediaStableId : undefined,
      mediaRelativePath: relativePath,
      mediaChecksum: photoHash,
      source: "migrated_server",
    });

    await deps.repository.save(local);
    const stored = await deps.repository.getById(local.stableId);
    if (!stored) {
      throw new Error("save confirmed missing");
    }

    const fingerprint: SourceFingerprint = await buildSourceFingerprint({
      legacyServerId: stored.legacyServerId ?? apiEntry.id,
      serverUpdatedAt: stored.serverUpdatedAt ?? apiEntry.updatedAt,
      content: stored.content,
      tags: stored.tags,
      photoHash,
      mediaCount: stored.mediaRefs.length,
    });

    return {
      status: "mirrored",
      serverId,
      stableId: stored.stableId,
      legacyServerId: stored.legacyServerId,
      detail: "mirrored server-canonical entry to encrypted candidate",
      fingerprint,
      serverFetched: true,
      needsRetry: false,
    };
  } catch (error) {
    if (relativePath) {
      await deps.media.delete(relativePath).catch(() => undefined);
    }
    return {
      status: "failed",
      serverId,
      stableId: null,
      legacyServerId: apiEntry.id,
      detail: safeErrorMessage(error),
      fingerprint: null,
      serverFetched: true,
      needsRetry: true,
    };
  }
}
