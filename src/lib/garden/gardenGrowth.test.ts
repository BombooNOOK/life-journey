import { describe, expect, it } from "vitest";

import {
  canWaterGardenToday,
  gardenStageFromWaterCount,
  isGardenPlantComplete,
  pickGardenComment,
} from "@/lib/garden/gardenGrowth";
import {
  gardenProgressPrimaryLabel,
  gardenProgressSecondaryLabel,
} from "@/lib/garden/gardenCopy";

describe("gardenGrowth", () => {
  it("maps water counts to the soft 10-stage bands", () => {
    expect(gardenStageFromWaterCount(0)).toBe(1);
    expect(gardenStageFromWaterCount(2)).toBe(1);
    expect(gardenStageFromWaterCount(3)).toBe(2);
    expect(gardenStageFromWaterCount(5)).toBe(2);
    expect(gardenStageFromWaterCount(6)).toBe(3);
    expect(gardenStageFromWaterCount(24)).toBe(9);
    expect(gardenStageFromWaterCount(27)).toBe(9);
    expect(gardenStageFromWaterCount(28)).toBe(10);
    expect(gardenStageFromWaterCount(40)).toBe(10);
  });

  it("allows one watering per Japan calendar day until complete at 28", () => {
    expect(
      canWaterGardenToday({
        waterCount: 2,
        lastWateredOn: null,
        todayKey: "2026-07-13",
      }),
    ).toBe(true);

    expect(
      canWaterGardenToday({
        waterCount: 2,
        lastWateredOn: "2026-07-13",
        todayKey: "2026-07-13",
      }),
    ).toBe(false);

    expect(
      canWaterGardenToday({
        waterCount: 27,
        lastWateredOn: "2026-07-12",
        todayKey: "2026-07-13",
      }),
    ).toBe(true);

    expect(
      canWaterGardenToday({
        waterCount: 28,
        lastWateredOn: "2026-07-12",
        todayKey: "2026-07-13",
      }),
    ).toBe(false);
  });

  it("treats completedAt as complete", () => {
    expect(isGardenPlantComplete(10, new Date())).toBe(true);
    expect(isGardenPlantComplete(28, null)).toBe(true);
    expect(isGardenPlantComplete(27, null)).toBe(false);
  });

  it("uses soft progress labels without denominators", () => {
    expect(gardenProgressPrimaryLabel(0, false)).toBe("これから、ゆっくり育ちます");
    expect(gardenProgressPrimaryLabel(7, false)).toBe("お水をあげた日：7回目");
    expect(gardenProgressSecondaryLabel(false)).toBe("今日も少し育っています");
    expect(gardenProgressPrimaryLabel(28, true)).toBe("きれいなお花が咲きました");
    expect(gardenProgressSecondaryLabel(true)).toBe(
      "28日分のお水で、\nここまで育ちました。",
    );
  });

  it("picks stable comments for the same seed", () => {
    const comments = ["a", "b", "c"] as const;
    expect(pickGardenComment(comments, "same")).toBe(pickGardenComment(comments, "same"));
  });
});
