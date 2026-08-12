/**
 * Resolve technical generation target from activation manifest (4B-4G).
 * Fail-closed. Never falls back to plaintext / hardcoded discovery.
 * Does not write manifest. Does not switch JournalRepository.
 */

import { Capacitor } from "@capacitor/core";

import {
  LocalJournalActivationManifestStore,
  createNativeManifestFs,
  resolveActivationManifestAbsolutePath,
  type ManifestFsPort,
} from "@/lib/local-first/journal/activation/LocalJournalActivationManifestStore";
import {
  resolveTechnicalActiveLocalJournalWithFs,
  type TechnicalResolveResult,
} from "@/lib/local-first/journal/activation/LocalJournalTechnicalActivation";
import { LocalJournalSecureBootstrapper } from "@/lib/local-first/journal/secureBootstrap/LocalJournalSecureBootstrapper";
import {
  mapManifestToResolvedGeneration,
  type GenerationResolveOutcome,
  type ResolvedLocalJournalGeneration,
} from "@/lib/local-first/journal/generation/ResolvedLocalJournalGeneration";
import {
  decideCapacityKnown,
  readAvailableBytesOrNull,
} from "@/lib/local-first/security";
import { LocalFirstSecurityError } from "@/lib/local-first/security/types";
import { TECHNICAL_ACTIVE_DATABASE_ID } from "@/lib/local-first/journal/activation/types";

function mapTechnicalStatus(
  status: TechnicalResolveResult["status"],
): GenerationResolveOutcome {
  switch (status) {
    case "no_activation":
      return { ok: false, reason: "no_activation", detail: status };
    case "corrupt_manifest":
      return { ok: false, reason: "corrupt_manifest", detail: status };
    case "missing_database":
      return { ok: false, reason: "missing_database", detail: status };
    case "preflight_failed":
      return { ok: false, reason: "preflight_failed", detail: status };
    case "checksum_mismatch":
      return { ok: false, reason: "checksum_mismatch", detail: status };
    case "unknown_format":
      return { ok: false, reason: "unknown_format", detail: status };
    case "rejected_target":
      return { ok: false, reason: "rejected_target", detail: status };
    default:
      return { ok: false, reason: "preflight_failed", detail: status };
  }
}

export async function resolveLocalJournalGenerationTargetWithFs(options: {
  fs: ManifestFsPort;
  absolutePath: string;
  availableBytes?: number | null;
  allowUnknownCapacity?: boolean;
  verifyDatabaseExists?: (databaseId: string) => Promise<boolean>;
}): Promise<GenerationResolveOutcome> {
  let availableBytes: number | null = null;
  if (Object.prototype.hasOwnProperty.call(options, "availableBytes")) {
    availableBytes = options.availableBytes ?? null;
  }
  const capacity = decideCapacityKnown(availableBytes);
  // Fail-closed unless caller explicitly allows unknown (native path gates before call).
  if (!capacity.known && options.allowUnknownCapacity !== true) {
    return {
      ok: false,
      reason: "capacity_unknown",
      detail: "capacity_unknown_fail_closed",
    };
  }

  const technical = await resolveTechnicalActiveLocalJournalWithFs({
    fs: options.fs,
    absolutePath: options.absolutePath,
    verifyDatabaseExists: options.verifyDatabaseExists,
  });
  if (technical.status !== "ready" || !technical.manifest) {
    return mapTechnicalStatus(technical.status);
  }

  return mapManifestToResolvedGeneration({
    generation: technical.manifest.generation,
    databaseId: technical.manifest.activeDatabaseId,
    mediaRootId: technical.manifest.activeMediaRootId,
    schemaVersion: technical.manifest.schemaVersion,
    manifestChecksum: technical.manifest.checksum,
  });
}

/**
 * Developer-only: resolve ready technical generation or deny.
 * Capacity unknown → refuse mirror start.
 */
export async function resolveLocalJournalGenerationTarget(options?: {
  availableBytes?: number | null;
  allowUnknownCapacity?: boolean;
}): Promise<GenerationResolveOutcome> {
  if (!Capacitor.isNativePlatform()) {
    throw new LocalFirstSecurityError("native_only", "generation resolve is native-only");
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
  const capacity = decideCapacityKnown(availableBytes);
  if (!capacity.known && options?.allowUnknownCapacity !== true) {
    return {
      ok: false,
      reason: "capacity_unknown",
      detail: "capacity_unknown_fail_closed",
    };
  }

  const absolutePath = await resolveActivationManifestAbsolutePath();
  const fs = await createNativeManifestFs();
  return resolveLocalJournalGenerationTargetWithFs({
    fs,
    absolutePath,
    availableBytes,
    allowUnknownCapacity: true, // already gated above
    verifyDatabaseExists: async (databaseId) => {
      if (databaseId !== TECHNICAL_ACTIVE_DATABASE_ID) return false;
      const inspection = await LocalJournalSecureBootstrapper.inspect();
      return inspection.exists === true && inspection.encrypted === true;
    },
  });
}

export async function readManifestChecksumNative(): Promise<string | null> {
  const read = await LocalJournalActivationManifestStore.readNative();
  return read.status === "ok" ? read.manifest.checksum : null;
}

export type { ResolvedLocalJournalGeneration };
