import type { DiskSpaceEstimate } from "@/lib/local-first/journal/encryptionMigration/types";

/** source + staging + promoted + sqlite overhead */
export const ENC_MIG_DISK_MULTIPLIER = 3 as const;
export const ENC_MIG_DISK_MIN_BYTES = 256 * 1024;

/** PoC-only reserve. Not a product-final value. */
export const ENC_MIG_POC_RESERVE_BYTES = 1 * 1024 * 1024;

/**
 * Production recommendation only (OS headroom for life-record migration).
 * Not adopted as a shipping constant this phase.
 */
export const ENC_MIG_PRODUCTION_RESERVE_BYTES_RECOMMENDED = 64 * 1024 * 1024;

export type DiskGuardMode = "production" | "fixture_poc";

export function estimateMigrationDiskNeed(sourceBytes: number): DiskSpaceEstimate {
  const recommendedFreeBytes = Math.max(
    ENC_MIG_DISK_MIN_BYTES,
    Math.ceil(sourceBytes * ENC_MIG_DISK_MULTIPLIER),
  );
  return {
    sourceBytes: Math.max(0, sourceBytes),
    recommendedFreeBytes,
    multiplier: ENC_MIG_DISK_MULTIPLIER,
  };
}

export function reserveBytesForMode(mode: DiskGuardMode): number {
  return mode === "production"
    ? ENC_MIG_PRODUCTION_RESERVE_BYTES_RECOMMENDED
    : ENC_MIG_POC_RESERVE_BYTES;
}

export function computeRequiredBytes(
  sourceBytes: number,
  reserveBytes: number,
): number {
  return (
    estimateMigrationDiskNeed(sourceBytes).recommendedFreeBytes + Math.max(0, reserveBytes)
  );
}

export function hasEnoughDiskForMigration(
  sourceBytes: number,
  availableBytes: number | null,
  options?: {
    mode?: DiskGuardMode;
    reserveBytes?: number;
    allowUnknownCapacity?: boolean;
  },
): {
  ok: boolean;
  estimate: DiskSpaceEstimate;
  requiredBytes: number;
  reserveBytes: number;
  reason?: string;
} {
  const mode = options?.mode ?? "production";
  const reserveBytes = options?.reserveBytes ?? reserveBytesForMode(mode);
  const estimate = estimateMigrationDiskNeed(sourceBytes);
  const requiredBytes = computeRequiredBytes(sourceBytes, reserveBytes);

  if (availableBytes == null) {
    const allowUnknown = options?.allowUnknownCapacity === true && mode === "fixture_poc";
    if (allowUnknown) {
      return {
        ok: true,
        estimate,
        requiredBytes,
        reserveBytes,
        reason: "available_bytes_unknown_fixture_override",
      };
    }
    return {
      ok: false,
      estimate,
      requiredBytes,
      reserveBytes,
      reason: "capacity_unknown_fail_closed",
    };
  }
  if (availableBytes < requiredBytes) {
    return {
      ok: false,
      estimate,
      requiredBytes,
      reserveBytes,
      reason: "insufficient_free_space",
    };
  }
  return { ok: true, estimate, requiredBytes, reserveBytes };
}
