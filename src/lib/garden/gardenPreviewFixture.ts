import {
  GARDEN_COMPLETE_PROMPT,
  GARDEN_STAGE_COMMENTS,
  gardenProgressPrimaryLabel,
  gardenProgressSecondaryLabel,
} from "@/lib/garden/gardenCopy";
import { gardenPlantStageSrc } from "@/lib/garden/gardenAssets";
import {
  GARDEN_WATER_GOAL,
  gardenStageFromWaterCount,
  pickGardenComment,
} from "@/lib/garden/gardenGrowth";
import type { GardenPlantView, GardenStateView } from "@/lib/garden/gardenPlant";

/** プレビュー用の初期状態（芽のころ） */
export function buildGardenPreviewPlant(waterCount = 0): GardenPlantView {
  const capped = Math.min(GARDEN_WATER_GOAL, Math.max(0, waterCount));
  const stage = gardenStageFromWaterCount(capped);
  const todayKey = "2026-07-13";
  const isComplete = capped >= GARDEN_WATER_GOAL;
  const wateredToday = false;
  const canWater = !isComplete;

  return {
    id: "preview-garden-plant",
    seedType: "default",
    waterCount: capped,
    waterGoal: GARDEN_WATER_GOAL,
    stage,
    plantImageSrc: gardenPlantStageSrc(stage),
    comment: isComplete
      ? GARDEN_COMPLETE_PROMPT
      : pickGardenComment(GARDEN_STAGE_COMMENTS[stage], `preview:${capped}:${stage}`),
    progressPrimary: gardenProgressPrimaryLabel(capped, isComplete),
    progressSecondary: gardenProgressSecondaryLabel(isComplete),
    lastWateredOn: null,
    todayKey,
    wateredToday,
    canWater,
    isComplete,
    showBloomChoices: isComplete,
    afterBloomChoice: null,
    statusLabel: isComplete
      ? gardenProgressPrimaryLabel(capped, true)
      : "気が向いたら、お水をあげてみてください",
    softMessage: isComplete ? gardenProgressSecondaryLabel(true) : null,
    completedAt: isComplete ? "2026-07-13T00:00:00.000Z" : null,
  };
}

export function buildGardenPreviewState(
  waterCount = 0,
  displayFlowers: GardenStateView["displayFlowers"] = [],
): GardenStateView {
  const plant = buildGardenPreviewPlant(waterCount);
  const occupied = new Set(displayFlowers.map((f) => f.slotIndex));
  const freeDisplaySlots = [1, 2, 3].filter((slot) => !occupied.has(slot));
  return { plant, displayFlowers, freeDisplaySlots };
}
