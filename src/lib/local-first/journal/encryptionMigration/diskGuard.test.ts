import { describe, expect, it } from "vitest";

import {
  ENC_MIG_POC_RESERVE_BYTES,
  ENC_MIG_PRODUCTION_RESERVE_BYTES_RECOMMENDED,
  computeRequiredBytes,
  estimateMigrationDiskNeed,
  hasEnoughDiskForMigration,
} from "@/lib/local-first/journal/encryptionMigration/diskGuard";

describe("encryption migration disk guard", () => {
  it("requires ~3x source size before reserve", () => {
    const estimate = estimateMigrationDiskNeed(1000);
    expect(estimate.recommendedFreeBytes).toBeGreaterThanOrEqual(3000);
  });

  it("adds reserve into required bytes", () => {
    const required = computeRequiredBytes(1_000_000, ENC_MIG_POC_RESERVE_BYTES);
    expect(required).toBe(
      estimateMigrationDiskNeed(1_000_000).recommendedFreeBytes + ENC_MIG_POC_RESERVE_BYTES,
    );
    expect(ENC_MIG_PRODUCTION_RESERVE_BYTES_RECOMMENDED).toBeGreaterThan(ENC_MIG_POC_RESERVE_BYTES);
  });

  it("fails when available bytes are below required", () => {
    const result = hasEnoughDiskForMigration(1_000_000, 100, { mode: "fixture_poc" });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("insufficient_free_space");
  });

  it("passes when available bytes cover estimate plus reserve", () => {
    const sourceBytes = 1_000_000;
    const required = computeRequiredBytes(sourceBytes, ENC_MIG_POC_RESERVE_BYTES);
    const result = hasEnoughDiskForMigration(sourceBytes, required, { mode: "fixture_poc" });
    expect(result.ok).toBe(true);
  });

  it("fail-closes when capacity is unknown in production mode", () => {
    const result = hasEnoughDiskForMigration(1000, null, { mode: "production" });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("capacity_unknown_fail_closed");
  });

  it("allows a fixture-only unknown-capacity override", () => {
    const result = hasEnoughDiskForMigration(1000, null, {
      mode: "fixture_poc",
      allowUnknownCapacity: true,
    });
    expect(result.ok).toBe(true);
    expect(result.reason).toBe("available_bytes_unknown_fixture_override");
  });
});
