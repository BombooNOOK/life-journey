/**
 * Server-authoritative write-through mirror PoC (4B-4E).
 *
 * Semantics: Server already holds the canonical entry (saved via normal Web LJD).
 * This service GETs that entry and mirrors it into encrypted Local candidate.
 *
 * Does NOT:
 * - call production Journal save
 * - dual-write independently
 * - activate pointer / switch Repository read
 * - write Server / delete Server
 * - run background sync
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
import { prepareCopyBatch } from "@/lib/local-first/journal/secureCopy/ServerToLocalCandidateCopyService";
import type { MirrorResult } from "@/lib/local-first/journal/secureCopy/types";
import { SERVER_COPY_TARGET_DB_NAME } from "@/lib/local-first/journal/secureCopy/types";
import { LocalJournalSecureBootstrapper } from "@/lib/local-first/journal/secureBootstrap/LocalJournalSecureBootstrapper";
import { readAvailableBytesOrNull } from "@/lib/local-first/security";
import { LocalFirstSecurityError } from "@/lib/local-first/security/types";

export type WriteThroughMirrorOptions = {
  availableBytes?: number | null;
  allowUnknownCapacity?: boolean;
  /**
   * Developer-only: force Local failure after Server GET succeeds.
   * Never rolls back Server (this service is GET-only on Server).
   */
  injectLocalFailure?: "save" | "media_write" | false;
};

function blockedMirror(
  blockedReason: string,
  serverEntryId: string | null,
  injected: WriteThroughMirrorOptions["injectLocalFailure"],
): MirrorResult {
  return {
    ok: false,
    targetDb: SERVER_COPY_TARGET_DB_NAME,
    result: "blocked",
    serverEntryId,
    needsRetry: false,
    stableId: null,
    legacyServerId: null,
    detail: blockedReason,
    fingerprint: null,
    blockedReason,
    candidateEncrypted: null,
    completeProtection: null,
    backupExcluded: null,
    rowCounts: null,
    injectedLocalFailure: injected ?? false,
  };
}

export async function mirrorExplicitIdWithDeps(
  serverEntryId: string,
  deps: MirrorPrimitiveDeps,
  options?: WriteThroughMirrorOptions,
): Promise<MirrorResult> {
  const prepared = prepareCopyBatch([serverEntryId], {
    availableBytes: options?.availableBytes ?? null,
    allowUnknownCapacity: options?.allowUnknownCapacity,
  });
  if (!prepared.ok) {
    return blockedMirror(
      prepared.batch.blockedReason ?? "blocked",
      serverEntryId,
      options?.injectLocalFailure,
    );
  }

  const mirrored = await mirrorServerJournalEntryToLocalGeneration(
    prepared.entryIds[0]!,
    {
      ...deps,
      injectLocalFailure: options?.injectLocalFailure ?? false,
    },
    prepared.availableBytes,
  );

  const rowCounts = {
    entries: await deps.repository.countEntries(),
    tags: await deps.repository.countTags(),
    media: await deps.repository.countMedia(),
  };

  return {
    ok: mirrored.status === "mirrored" || mirrored.status === "already_present",
    targetDb: SERVER_COPY_TARGET_DB_NAME,
    result: mirrored.status,
    serverEntryId: mirrored.serverId,
    needsRetry: mirrored.needsRetry,
    stableId: mirrored.stableId,
    legacyServerId: mirrored.legacyServerId,
    detail: mirrored.detail,
    fingerprint: mirrored.fingerprint,
    blockedReason: null,
    candidateEncrypted: true,
    completeProtection: null,
    backupExcluded: null,
    rowCounts,
    injectedLocalFailure: options?.injectLocalFailure ?? false,
  };
}

export const ServerAuthoritativeWriteThroughMirrorService = {
  /**
   * Mirror one explicit Server entry into encrypted candidate.
   * Production Journal save path must not call this.
   */
  async mirrorExplicitId(
    serverEntryId: string,
    options?: WriteThroughMirrorOptions,
  ): Promise<MirrorResult> {
    if (!Capacitor.isNativePlatform()) {
      throw new LocalFirstSecurityError(
        "native_only",
        "write-through mirror is native-only",
      );
    }
    assertAllowedCopyTargetDb(SERVER_COPY_TARGET_DB_NAME);

    const availableBytes =
      options && Object.prototype.hasOwnProperty.call(options, "availableBytes")
        ? (options.availableBytes ?? null)
        : (await readAvailableBytesOrNull()).availableBytes;

    const prepared = prepareCopyBatch([serverEntryId], {
      availableBytes,
      allowUnknownCapacity: options?.allowUnknownCapacity,
    });
    if (!prepared.ok) {
      return blockedMirror(
        prepared.batch.blockedReason ?? "blocked",
        serverEntryId,
        options?.injectLocalFailure,
      );
    }

    const media = await createNativeCandidateMediaStore();
    const result = await withCandidateRepository(async (repository) =>
      mirrorExplicitIdWithDeps(
        prepared.entryIds[0]!,
        {
          fetchEntry: fetchAuthenticatedJournalEntry,
          downloadPhoto: downloadJournalPhotoBase64,
          repository,
          media,
          createStableId: createLocalStableId,
        },
        {
          availableBytes,
          allowUnknownCapacity: true,
          injectLocalFailure: options?.injectLocalFailure ?? false,
        },
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
