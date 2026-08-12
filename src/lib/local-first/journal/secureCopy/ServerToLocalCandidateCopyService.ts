/**
 * Server → encrypted Local candidate multi-entry copy.
 * Explicit entry IDs only. Never retargets ljd_local_journal.
 * Not invoked from general app startup.
 */

import { Capacitor } from "@capacitor/core";

import { sha256HexOfBase64 } from "@/lib/local-first/journal/checksum";
import { mapServerJournalEntryLikeToLocal } from "@/lib/local-first/journal/mapper";
import { createLocalStableId } from "@/lib/local-first/journal/stableId";
import {
  apiJournalToServerLike,
  downloadJournalPhotoBase64,
  fetchAuthenticatedJournalEntry,
  journalEntryNeedsPhoto,
  type ApiJournalEntry,
} from "@/lib/local-first/journal/serverFetch";
import { createNativeCandidateMediaStore } from "@/lib/local-first/journal/secureCopy/candidateMediaStore";
import { assertAllowedCopyTargetDb } from "@/lib/local-first/journal/secureCopy/candidateDbGuard";
import { withCandidateRepository } from "@/lib/local-first/journal/secureCopy/candidateRepository";
import {
  buildSourceFingerprint,
  fingerprintFromLocalEntry,
  sourceFingerprintChanged,
} from "@/lib/local-first/journal/secureCopy/sourceFingerprint";
import { hasTestPurposeTag, parseExplicitEntryIds } from "@/lib/local-first/journal/secureCopy/testEntryGuard";
import type {
  CandidateMediaPort,
  CopyBatchResult,
  CopyEntryResult,
  JournalRepositoryPort,
  SourceFingerprint,
} from "@/lib/local-first/journal/secureCopy/types";
import {
  SECURE_COPY_MAX_EXPLICIT_IDS,
  SECURE_COPY_MIN_AVAILABLE_BYTES,
  SERVER_COPY_TARGET_DB_NAME,
} from "@/lib/local-first/journal/secureCopy/types";
import { LocalJournalSecureBootstrapper } from "@/lib/local-first/journal/secureBootstrap/LocalJournalSecureBootstrapper";
import {
  decideCapacityKnown,
  readAvailableBytesOrNull,
  safeErrorMessage,
} from "@/lib/local-first/security";
import { LocalFirstSecurityError } from "@/lib/local-first/security/types";

export type CopyServiceDeps = {
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
};

function emptyBatch(blockedReason: string | null): CopyBatchResult {
  return {
    ok: false,
    targetDb: SERVER_COPY_TARGET_DB_NAME,
    copied: 0,
    alreadyPresent: 0,
    sourceChanged: 0,
    failed: 0,
    results: [],
    blockedReason,
    candidateEncrypted: null,
    completeProtection: null,
    backupExcluded: null,
    rowCounts: null,
  };
}

function summarize(results: CopyEntryResult[]): Pick<
  CopyBatchResult,
  "copied" | "alreadyPresent" | "sourceChanged" | "failed" | "ok"
> {
  const copied = results.filter((r) => r.status === "copied").length;
  const alreadyPresent = results.filter((r) => r.status === "already_present").length;
  const sourceChanged = results.filter((r) => r.status === "source_changed").length;
  const failed = results.filter((r) => r.status === "failed").length;
  return {
    copied,
    alreadyPresent,
    sourceChanged,
    failed,
    ok: failed === 0 && sourceChanged === 0,
  };
}

function failResult(serverId: string, detail: string): CopyEntryResult {
  return {
    status: "failed",
    serverId,
    stableId: null,
    legacyServerId: null,
    detail,
    fingerprint: null,
  };
}

async function copyOne(
  serverId: string,
  deps: CopyServiceDeps,
  availableBytes: number | null,
): Promise<CopyEntryResult> {
  const fetched = await deps.fetchEntry(serverId);
  if (!fetched.ok) {
    return failResult(serverId, fetched.message);
  }
  const apiEntry = fetched.entry;
  const serverLike = apiJournalToServerLike(apiEntry);
  if (!hasTestPurposeTag(serverLike.tags)) {
    return failResult(serverId, "not_test_entry");
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
      };
    }
    return {
      status: "already_present",
      serverId,
      stableId: existing.stableId,
      legacyServerId: existing.legacyServerId,
      detail: "legacyServerId already present; left untouched",
      fingerprint: existingFp,
    };
  }

  let photoBase64: string | null = null;
  let photoBytes = 0;
  let photoMime: string | null = null;
  let photoHash: string | null = null;
  if (journalEntryNeedsPhoto(apiEntry)) {
    const photo = await deps.downloadPhoto(apiEntry.id, apiEntry.photoDataUrl);
    if (!photo.ok) {
      return failResult(serverId, photo.message);
    }
    if (
      availableBytes != null &&
      photo.byteLength > 0 &&
      photo.byteLength > availableBytes
    ) {
      return failResult(serverId, "insufficient_free_space");
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
        return failResult(serverId, "photo_checksum_mismatch");
      }
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
      status: "copied",
      serverId,
      stableId: stored.stableId,
      legacyServerId: stored.legacyServerId,
      detail: "copied to encrypted candidate",
      fingerprint,
    };
  } catch (error) {
    if (relativePath) {
      await deps.media.delete(relativePath).catch(() => undefined);
    }
    return failResult(serverId, safeErrorMessage(error));
  }
}

export function prepareCopyBatch(
  rawIds: string[] | string,
  options?: {
    availableBytes?: number | null;
    allowUnknownCapacity?: boolean;
  },
): { ok: true; entryIds: string[]; availableBytes: number | null } | { ok: false; batch: CopyBatchResult } {
  assertAllowedCopyTargetDb(SERVER_COPY_TARGET_DB_NAME);
  const entryIds = parseExplicitEntryIds(rawIds);
  if (entryIds.length === 0) {
    return { ok: false, batch: emptyBatch("explicit_ids_required") };
  }
  if (entryIds.length > SECURE_COPY_MAX_EXPLICIT_IDS) {
    return { ok: false, batch: emptyBatch("too_many_explicit_ids") };
  }

  const availableBytes =
    options && Object.prototype.hasOwnProperty.call(options, "availableBytes")
      ? (options.availableBytes ?? null)
      : null;
  const known = decideCapacityKnown(availableBytes);
  if (!known.known && options?.allowUnknownCapacity !== true) {
    return { ok: false, batch: emptyBatch("capacity_unknown_fail_closed") };
  }
  if (
    known.known &&
    known.availableBytes != null &&
    known.availableBytes < SECURE_COPY_MIN_AVAILABLE_BYTES
  ) {
    return { ok: false, batch: emptyBatch("insufficient_free_space") };
  }
  return { ok: true, entryIds, availableBytes };
}

export async function copyExplicitIdsWithDeps(
  rawIds: string[] | string,
  deps: CopyServiceDeps,
  options?: {
    availableBytes?: number | null;
    allowUnknownCapacity?: boolean;
  },
): Promise<CopyBatchResult> {
  const prepared = prepareCopyBatch(rawIds, options);
  if (!prepared.ok) return prepared.batch;

  const results: CopyEntryResult[] = [];
  for (const id of prepared.entryIds) {
    results.push(await copyOne(id, deps, prepared.availableBytes));
  }
  const summary = summarize(results);
  const rowCounts = {
    entries: await deps.repository.countEntries(),
    tags: await deps.repository.countTags(),
    media: await deps.repository.countMedia(),
  };
  return {
    ...summary,
    targetDb: SERVER_COPY_TARGET_DB_NAME,
    results,
    blockedReason: null,
    candidateEncrypted: true,
    completeProtection: null,
    backupExcluded: null,
    rowCounts,
  };
}

export const ServerToLocalCandidateCopyService = {
  async copyExplicitIds(
    rawIds: string[] | string,
    options?: {
      availableBytes?: number | null;
      allowUnknownCapacity?: boolean;
    },
  ): Promise<CopyBatchResult> {
    if (!Capacitor.isNativePlatform()) {
      throw new LocalFirstSecurityError("native_only", "candidate copy is native-only");
    }
    assertAllowedCopyTargetDb(SERVER_COPY_TARGET_DB_NAME);

    const availableBytes =
      options && Object.prototype.hasOwnProperty.call(options, "availableBytes")
        ? (options.availableBytes ?? null)
        : (await readAvailableBytesOrNull()).availableBytes;

    const prepared = prepareCopyBatch(rawIds, {
      availableBytes,
      allowUnknownCapacity: options?.allowUnknownCapacity,
    });
    if (!prepared.ok) return prepared.batch;

    const media = await createNativeCandidateMediaStore();
    const result = await withCandidateRepository(async (repository) =>
      copyExplicitIdsWithDeps(
        rawIds,
        {
          fetchEntry: fetchAuthenticatedJournalEntry,
          downloadPhoto: downloadJournalPhotoBase64,
          repository,
          media,
          createStableId: createLocalStableId,
        },
        { availableBytes, allowUnknownCapacity: true },
      ),
    );
    const inspection = await LocalJournalSecureBootstrapper.inspect();
    return {
      ...result,
      candidateEncrypted: inspection.encrypted,
      completeProtection: inspection.completeProtection,
      backupExcluded: inspection.backupExcluded,
    };
  },
};
