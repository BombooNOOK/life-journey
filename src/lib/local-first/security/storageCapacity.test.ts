import { describe, expect, it } from "vitest";

import {
  decideCapacityKnown,
  mapVolumeResultToReading,
} from "@/lib/local-first/security/storageCapacity";

describe("storage capacity foundation", () => {
  it("maps a successful plugin reading", () => {
    const reading = mapVolumeResultToReading(
      {
        ok: true,
        availableBytes: 6_780_035_072,
        importantUsageBytes: 6_780_035_072,
        volumeAvailableCapacity: 1_000,
        opportunisticUsageBytes: 500,
        source: "volumeAvailableCapacityForImportantUsage",
      },
      "ios",
    );
    expect(reading.ok).toBe(true);
    expect(reading.availableBytes).toBe(6_780_035_072);
    expect(reading.platform).toBe("ios");
    expect(reading.source).toBe("volumeAvailableCapacityForImportantUsage");
  });

  it("treats missing availableBytes as unavailable", () => {
    const reading = mapVolumeResultToReading(
      {
        ok: false,
        availableBytes: null,
        importantUsageBytes: null,
        volumeAvailableCapacity: null,
        opportunisticUsageBytes: null,
        source: "unavailable",
      },
      "ios",
    );
    expect(reading.ok).toBe(false);
    expect(decideCapacityKnown(reading.availableBytes)).toEqual({
      known: false,
      availableBytes: null,
      reason: "capacity_unknown_fail_closed",
    });
  });

  it("fail-closes when capacity is unknown", () => {
    expect(decideCapacityKnown(null).reason).toBe("capacity_unknown_fail_closed");
    expect(decideCapacityKnown(0).known).toBe(true);
    expect(decideCapacityKnown(1310720).known).toBe(true);
  });
});
