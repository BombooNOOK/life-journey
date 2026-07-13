import { calendarDayKeyInJapanFromDate } from "@/lib/date/japanCalendarDate";
import {
  GARDEN_COMPLETE_BODY,
  GARDEN_STAGE_COMMENTS,
  GARDEN_STATUS_NOT_WATERED,
  GARDEN_STATUS_WATERED,
  GARDEN_WATERED_SOFT_MESSAGE,
  gardenProgressPrimaryLabel,
  gardenProgressSecondaryLabel,
} from "@/lib/garden/gardenCopy";
import { gardenPlantStageSrc } from "@/lib/garden/gardenAssets";
import {
  GARDEN_DEFAULT_SEED_TYPE,
  GARDEN_WATER_GOAL,
  canWaterGardenToday,
  gardenStageFromWaterCount,
  isGardenPlantComplete,
  pickGardenComment,
  type GardenGrowthStage,
} from "@/lib/garden/gardenGrowth";
import { normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";

export type GardenPlantView = {
  id: string;
  seedType: string;
  waterCount: number;
  /** 内部・詳細用（メインUIでは分母表示しない） */
  waterGoal: number;
  stage: GardenGrowthStage;
  plantImageSrc: string;
  comment: string;
  /** メイン進捗（分母なし） */
  progressPrimary: string;
  progressSecondary: string;
  lastWateredOn: string | null;
  todayKey: string;
  wateredToday: boolean;
  canWater: boolean;
  isComplete: boolean;
  statusLabel: string;
  softMessage: string | null;
  completedAt: string | null;
};

function toView(row: {
  id: string;
  seedType: string;
  waterCount: number;
  lastWateredOn: string | null;
  completedAt: Date | null;
}): GardenPlantView {
  const todayKey = calendarDayKeyInJapanFromDate(new Date());
  const isComplete = isGardenPlantComplete(row.waterCount, row.completedAt);
  const stage = gardenStageFromWaterCount(row.waterCount);
  const wateredToday = row.lastWateredOn === todayKey;
  const canWater = canWaterGardenToday({
    waterCount: row.waterCount,
    lastWateredOn: row.lastWateredOn,
    todayKey,
    completedAt: row.completedAt,
  });

  const comments = GARDEN_STAGE_COMMENTS[stage];
  const comment = isComplete
    ? GARDEN_COMPLETE_BODY
    : pickGardenComment(comments, `${row.id}:${todayKey}:${stage}`);

  let statusLabel = GARDEN_STATUS_NOT_WATERED;
  let softMessage: string | null = null;
  if (isComplete) {
    statusLabel = gardenProgressPrimaryLabel(row.waterCount, true);
    softMessage = gardenProgressSecondaryLabel(true);
  } else if (wateredToday) {
    statusLabel = GARDEN_STATUS_WATERED;
    softMessage = GARDEN_WATERED_SOFT_MESSAGE;
  }

  return {
    id: row.id,
    seedType: row.seedType,
    waterCount: row.waterCount,
    waterGoal: GARDEN_WATER_GOAL,
    stage,
    plantImageSrc: gardenPlantStageSrc(stage, row.seedType),
    comment,
    progressPrimary: gardenProgressPrimaryLabel(row.waterCount, isComplete),
    progressSecondary: gardenProgressSecondaryLabel(isComplete),
    lastWateredOn: row.lastWateredOn,
    todayKey,
    wateredToday,
    canWater,
    isComplete,
    statusLabel,
    softMessage,
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

export async function ensureGardenPlantForProfile(params: {
  email: string;
  profileId: string;
  seedType?: string;
}): Promise<GardenPlantView> {
  const email = normalizeEmail(params.email);
  if (!email) {
    throw new Error("email required");
  }
  const profileId = params.profileId.trim();
  if (!profileId) {
    throw new Error("profileId required");
  }
  const seedType = params.seedType?.trim() || GARDEN_DEFAULT_SEED_TYPE;

  const existing = await prisma.gardenPlant.findUnique({
    where: {
      email_profileId_seedType_gardenSlot: {
        email,
        profileId,
        seedType,
        gardenSlot: 0,
      },
    },
  });
  if (existing) return toView(existing);

  const created = await prisma.gardenPlant.create({
    data: {
      email,
      profileId,
      seedType,
      gardenSlot: 0,
    },
  });
  return toView(created);
}

export async function waterGardenPlantForProfile(params: {
  email: string;
  profileId: string;
  seedType?: string;
}): Promise<{ ok: true; plant: GardenPlantView } | { ok: false; error: string; plant?: GardenPlantView }> {
  const email = normalizeEmail(params.email);
  if (!email) return { ok: false, error: "メールアドレスを確認できませんでした。" };
  const profileId = params.profileId.trim();
  if (!profileId) return { ok: false, error: "プロフィールを確認できませんでした。" };

  const seedType = params.seedType?.trim() || GARDEN_DEFAULT_SEED_TYPE;
  const todayKey = calendarDayKeyInJapanFromDate(new Date());

  const plant = await ensureGardenPlantForProfile({ email, profileId, seedType });
  if (!plant.canWater) {
    if (plant.isComplete) {
      return { ok: false, error: "このお花はすでに咲いています。", plant };
    }
    return { ok: false, error: "今日はもうお水をあげました。", plant };
  }

  const nextCount = Math.min(GARDEN_WATER_GOAL, plant.waterCount + 1);
  const completedAt = nextCount >= GARDEN_WATER_GOAL ? new Date() : null;

  const updated = await prisma.gardenPlant.update({
    where: { id: plant.id },
    data: {
      waterCount: nextCount,
      lastWateredOn: todayKey,
      ...(completedAt ? { completedAt } : {}),
    },
  });

  return { ok: true, plant: toView(updated) };
}
