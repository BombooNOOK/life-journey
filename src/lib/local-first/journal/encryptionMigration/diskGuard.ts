import type { DiskSpaceEstimate } from "@/lib/local-first/journal/encryptionMigration/types";

/** source + staging + promoted + sqlite overhead */
export const ENC_MIG_DISK_MULTIPLIER = 3 as const;
export const ENC_MIG_DISK_MIN_BYTES = 256 * 1024;

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

export function hasEnoughDiskForMigration(
  sourceBytes: number,
  availableBytes: number | null,
): { ok: boolean; estimate: DiskSpaceEstimate; reason?: string } {
  const estimate = estimateMigrationDiskNeed(sourceBytes);
  if (availableBytes == null) {
    return { ok: true, estimate, reason: "available_bytes_unknown_continue_with_estimate" };
  }
  if (availableBytes < estimate.recommendedFreeBytes) {
    return { ok: false, estimate, reason: "insufficient_free_space" };
  }
  return { ok: true, estimate };
}
