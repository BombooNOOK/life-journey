import { describe, expect, it } from "vitest";

import {
  estimateMigrationDiskNeed,
  hasEnoughDiskForMigration,
} from "@/lib/local-first/journal/encryptionMigration/diskGuard";

describe("encryption migration disk guard", () => {
  it("requires ~3x source size", () => {
    const estimate = estimateMigrationDiskNeed(1000);
    expect(estimate.recommendedFreeBytes).toBeGreaterThanOrEqual(3000);
  });

  it("fails when available bytes are below the estimate", () => {
    const result = hasEnoughDiskForMigration(1_000_000, 100);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("insufficient_free_space");
  });

  it("continues when available bytes are unknown", () => {
    expect(hasEnoughDiskForMigration(1000, null).ok).toBe(true);
  });
});
