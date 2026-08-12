/**
 * Server → encrypted Local candidate multi-entry copy (historical).
 * Explicit entry IDs only. Never retargets ljd_local_journal.
 * Not invoked from general app startup.
 *
 * Low-level mirror: mirrorServerJournalEntryToLocalGeneration
 * (shared with write-through PoC).
 */

import { Capacitor } from "@capacitor/core";

import { createLocalStableId } from "@/lib/local-first/journal/stableId";
import {
  downloadJournalPhotoBase64,
  fetchAuthenticatedJournalEntry,
} from "@/lib/local-first/journal/serverFetch";
import { createNativeCandidateMediaStore } from "@/lib/local-first/journal/secureCopy/candidateMediaStore";
import { assertAllowedCopyTargetDb } from "@/lib/local-first/journal/secureCopy/candidateDbGuard";
import { withCandidateRepository } from "@/lib/local-first/journal/secureCopy/candidateRepository";
import {
  mirrorServerJournalEntryToLocalGeneration,
  type MirrorPrimitiveDeps,
} from "@/lib/local-first/journal/secureCopy/mirrorServerJournalEntry";
import { parseExplicitEntryIds } from "@/lib/local-first/journal/secureCopy/testEntryGuard";
import type {
  CopyBatchResult,
  CopyEntryResult,
  MirrorEntryResult,
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
} from "@/lib/local-first/security";
import { LocalFirstSecurityError } from "@/lib/local-first/security/types";

/** Historical copy deps = mirror primitive deps (no Local failure injection by default). */
export type CopyServiceDeps = MirrorPrimitiveDeps;

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

function toCopyEntryResult(mirror: MirrorEntryResult): CopyEntryResult {
  const status =
    mirror.status === "mirrored" ? ("copied" as const) : mirror.status;
  return {
    status,
    serverId: mirror.serverId,
    stableId: mirror.stableId,
    legacyServerId: mirror.legacyServerId,
    detail: mirror.detail,
    fingerprint: mirror.fingerprint,
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
    const mirrored = await mirrorServerJournalEntryToLocalGeneration(
      id,
      deps,
      prepared.availableBytes,
    );
    results.push(toCopyEntryResult(mirrored));
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
