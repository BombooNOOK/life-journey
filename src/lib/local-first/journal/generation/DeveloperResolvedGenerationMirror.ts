/**
 * Developer-only: resolve technical generation → mirror into that fixed target.
 *
 * Separation of duties:
 * - resolver decides ResolvedLocalJournalGeneration
 * - mirrorServerJournalEntryToLocalGeneration writes into provided ports
 * - this module never rewrites activation manifest
 *
 * Not wired to production Journal save / Repository.
 */

import { Capacitor } from "@capacitor/core";

import {
  assertDbMediaPairIntegrity,
  type ResolvedLocalJournalGeneration,
} from "@/lib/local-first/journal/generation/ResolvedLocalJournalGeneration";
import {
  readManifestChecksumNative,
  resolveLocalJournalGenerationTarget,
  resolveLocalJournalGenerationTargetWithFs,
} from "@/lib/local-first/journal/generation/resolveLocalJournalGenerationTarget";
import {
  LocalJournalActivationManifestStore,
  type ManifestFsPort,
} from "@/lib/local-first/journal/activation/LocalJournalActivationManifestStore";
import { createLocalStableId } from "@/lib/local-first/journal/stableId";
import {
  downloadJournalPhotoBase64,
  fetchAuthenticatedJournalEntry,
} from "@/lib/local-first/journal/serverFetch";
import { createNativeCandidateMediaStore } from "@/lib/local-first/journal/secureCopy/candidateMediaStore";
import { withCandidateRepository } from "@/lib/local-first/journal/secureCopy/candidateRepository";
import {
  mirrorServerJournalEntryToLocalGeneration,
  type MirrorPrimitiveDeps,
} from "@/lib/local-first/journal/secureCopy/mirrorServerJournalEntry";
import { prepareCopyBatch } from "@/lib/local-first/journal/secureCopy/ServerToLocalCandidateCopyService";
import type { MirrorEntryResult, MirrorResult } from "@/lib/local-first/journal/secureCopy/types";
import { SERVER_COPY_TARGET_DB_NAME } from "@/lib/local-first/journal/secureCopy/types";
import { LocalJournalSecureBootstrapper } from "@/lib/local-first/journal/secureBootstrap/LocalJournalSecureBootstrapper";
import { readAvailableBytesOrNull } from "@/lib/local-first/security";
import { LocalFirstSecurityError } from "@/lib/local-first/security/types";
import { TECHNICAL_ACTIVE_DATABASE_ID } from "@/lib/local-first/journal/activation/types";

export type ResolvedGenerationMirrorResult = MirrorResult & {
  resolvedTarget: ResolvedLocalJournalGeneration | null;
  /** True when manifest checksum changed after the fixed-target operation. */
  manifestChangedDuringOperation: boolean;
  resolveDeniedReason: string | null;
};

function blocked(
  reason: string,
  serverEntryId: string | null,
  extras?: Partial<ResolvedGenerationMirrorResult>,
): ResolvedGenerationMirrorResult {
  return {
    ok: false,
    targetDb: SERVER_COPY_TARGET_DB_NAME,
    result: "blocked",
    serverEntryId,
    needsRetry: false,
    stableId: null,
    legacyServerId: null,
    detail: reason,
    fingerprint: null,
    blockedReason: reason,
    candidateEncrypted: null,
    completeProtection: null,
    backupExcluded: null,
    rowCounts: null,
    injectedLocalFailure: false,
    resolvedTarget: null,
    manifestChangedDuringOperation: false,
    resolveDeniedReason: reason,
    ...extras,
  };
}

/**
 * Bind ports for a resolved generation. Currently only encrypted candidate pair is allowed.
 * Manifest is not read here — caller supplies the already-resolved target.
 */
export function assertMirrorTargetGeneration(
  target: ResolvedLocalJournalGeneration,
): void {
  assertDbMediaPairIntegrity(target);
  if (target.databaseId !== TECHNICAL_ACTIVE_DATABASE_ID) {
    throw new Error(`unsupported_databaseId=${target.databaseId}`);
  }
  if (target.databaseId !== SERVER_COPY_TARGET_DB_NAME) {
    throw new Error("mirror target must be encrypted candidate generation");
  }
}

export async function mirrorExplicitIdToResolvedGenerationWithDeps(options: {
  serverEntryId: string;
  target: ResolvedLocalJournalGeneration;
  deps: MirrorPrimitiveDeps;
  availableBytes?: number | null;
  allowUnknownCapacity?: boolean;
  /** Optional: re-read checksum after mirror to detect manifest drift. */
  readChecksumAfter?: () => Promise<string | null>;
}): Promise<ResolvedGenerationMirrorResult> {
  try {
    assertMirrorTargetGeneration(options.target);
  } catch (error) {
    return blocked(String(error), options.serverEntryId, {
      resolvedTarget: options.target,
      resolveDeniedReason: String(error),
    });
  }

  // Freeze target for this one-entry logical unit
  const fixedTarget = { ...options.target };

  const prepared = prepareCopyBatch([options.serverEntryId], {
    availableBytes: options.availableBytes ?? null,
    allowUnknownCapacity: options.allowUnknownCapacity,
  });
  if (!prepared.ok) {
    return blocked(prepared.batch.blockedReason ?? "blocked", options.serverEntryId, {
      resolvedTarget: fixedTarget,
      resolveDeniedReason: null,
    });
  }

  const mirrored: MirrorEntryResult = await mirrorServerJournalEntryToLocalGeneration(
    prepared.entryIds[0]!,
    options.deps,
    prepared.availableBytes,
  );

  const rowCounts = {
    entries: await options.deps.repository.countEntries(),
    tags: await options.deps.repository.countTags(),
    media: await options.deps.repository.countMedia(),
  };

  let manifestChangedDuringOperation = false;
  if (options.readChecksumAfter) {
    const after = await options.readChecksumAfter();
    if (after != null && after !== fixedTarget.manifestChecksum) {
      manifestChangedDuringOperation = true;
    }
  }

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
    injectedLocalFailure: false,
    resolvedTarget: fixedTarget,
    manifestChangedDuringOperation,
    resolveDeniedReason: null,
  };
}

/**
 * Full developer path: resolve → fixed target → mirror.
 * Does not mutate activation manifest.
 */
export async function mirrorExplicitIdViaResolvedGenerationWithFs(options: {
  serverEntryId: string;
  fs: ManifestFsPort;
  absolutePath: string;
  deps: MirrorPrimitiveDeps;
  availableBytes?: number | null;
  allowUnknownCapacity?: boolean;
  verifyDatabaseExists?: (databaseId: string) => Promise<boolean>;
}): Promise<ResolvedGenerationMirrorResult> {
  const resolved = await resolveLocalJournalGenerationTargetWithFs({
    fs: options.fs,
    absolutePath: options.absolutePath,
    availableBytes: options.availableBytes,
    allowUnknownCapacity: options.allowUnknownCapacity,
    verifyDatabaseExists: options.verifyDatabaseExists,
  });
  if (!resolved.ok) {
    return blocked(resolved.reason, options.serverEntryId, {
      resolveDeniedReason: resolved.reason,
      detail: resolved.detail,
    });
  }

  return mirrorExplicitIdToResolvedGenerationWithDeps({
    serverEntryId: options.serverEntryId,
    target: resolved.target,
    deps: options.deps,
    availableBytes: options.availableBytes,
    allowUnknownCapacity: options.allowUnknownCapacity,
    readChecksumAfter: async () => {
      const read = await LocalJournalActivationManifestStore.readWithFs(
        options.absolutePath,
        options.fs,
      );
      return read.status === "ok" ? read.manifest.checksum : null;
    },
  });
}

export const DeveloperResolvedGenerationMirror = {
  async mirrorExplicitId(
    serverEntryId: string,
    options?: {
      availableBytes?: number | null;
      allowUnknownCapacity?: boolean;
    },
  ): Promise<ResolvedGenerationMirrorResult> {
    if (!Capacitor.isNativePlatform()) {
      throw new LocalFirstSecurityError(
        "native_only",
        "resolved-generation mirror is native-only",
      );
    }

    let availableBytes: number | null;
    if (options && Object.prototype.hasOwnProperty.call(options, "availableBytes")) {
      availableBytes = options.availableBytes ?? null;
    } else {
      availableBytes = (await readAvailableBytesOrNull()).availableBytes;
      if (availableBytes == null) {
        availableBytes = (await readAvailableBytesOrNull()).availableBytes;
      }
    }

    const resolved = await resolveLocalJournalGenerationTarget(
      availableBytes != null
        ? { availableBytes }
        : { availableBytes: null },
    );
    if (!resolved.ok) {
      return blocked(resolved.reason, serverEntryId, {
        resolveDeniedReason: resolved.reason,
        detail: resolved.detail,
      });
    }

    assertMirrorTargetGeneration(resolved.target);

    const media = await createNativeCandidateMediaStore();
    const result = await withCandidateRepository(async (repository) =>
      mirrorExplicitIdToResolvedGenerationWithDeps({
        serverEntryId,
        target: resolved.target,
        deps: {
          fetchEntry: fetchAuthenticatedJournalEntry,
          downloadPhoto: downloadJournalPhotoBase64,
          repository,
          media,
          createStableId: createLocalStableId,
        },
        availableBytes,
        allowUnknownCapacity: true,
        readChecksumAfter: readManifestChecksumNative,
      }),
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
