import { calendarDayKeyInJapanFromDate } from "@/lib/date/japanCalendarDate";
import {
  GARDEN_COMPLETE_BODY,
  GARDEN_DISPLAY_DONE_MESSAGE,
  GARDEN_DISPLAY_SLOT_COUNT,
  GARDEN_DISPLAY_SLOTS_FULL_MESSAGE,
  GARDEN_KEEP_DONE_MESSAGE,
  GARDEN_SHARE_COMING_SOON_MESSAGE,
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

export type GardenAfterBloomChoice = "keep" | "displayed" | "shared";

export type GardenDisplayFlowerView = {
  id: string;
  slotIndex: number;
  seedType: string;
  plantImageSrc: string;
};

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
  /** 満開後の選択を出すか（keep 中も後から選べる） */
  showBloomChoices: boolean;
  afterBloomChoice: GardenAfterBloomChoice | null;
  statusLabel: string;
  softMessage: string | null;
  completedAt: string | null;
};

// statusLabel は定数リテラルに狭めない（割り当て先を string に固定）

export type GardenStateView = {
  plant: GardenPlantView;
  displayFlowers: GardenDisplayFlowerView[];
  freeDisplaySlots: number[];
};

function toPlantView(row: {
  id: string;
  seedType: string;
  waterCount: number;
  lastWateredOn: string | null;
  completedAt: Date | null;
  afterBloomChoice: string | null;
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

  const afterBloomChoice =
    row.afterBloomChoice === "keep" ||
    row.afterBloomChoice === "displayed" ||
    row.afterBloomChoice === "shared"
      ? row.afterBloomChoice
      : null;

  const comments = GARDEN_STAGE_COMMENTS[stage];
  const comment = isComplete
    ? GARDEN_COMPLETE_BODY
    : pickGardenComment(comments, `${row.id}:${todayKey}:${stage}`);

  let statusLabel: string = GARDEN_STATUS_NOT_WATERED;
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
    showBloomChoices: isComplete && afterBloomChoice !== "displayed",
    afterBloomChoice,
    statusLabel,
    softMessage,
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

async function listDisplayFlowers(
  email: string,
  profileId: string,
): Promise<GardenDisplayFlowerView[]> {
  const rows = await prisma.gardenDisplayFlower.findMany({
    where: { email, profileId },
    orderBy: { slotIndex: "asc" },
  });
  return rows.map((row) => ({
    id: row.id,
    slotIndex: row.slotIndex,
    seedType: row.seedType,
    plantImageSrc: gardenPlantStageSrc(10, row.seedType),
  }));
}

function freeSlotsFrom(occupied: number[]): number[] {
  const used = new Set(occupied);
  const free: number[] = [];
  for (let slot = 1; slot <= GARDEN_DISPLAY_SLOT_COUNT; slot += 1) {
    if (!used.has(slot)) free.push(slot);
  }
  return free;
}

export async function loadGardenStateForProfile(params: {
  email: string;
  profileId: string;
  seedType?: string;
}): Promise<GardenStateView> {
  const plant = await ensureGardenPlantForProfile(params);
  const email = normalizeEmail(params.email);
  const profileId = params.profileId.trim();
  const displayFlowers = await listDisplayFlowers(email, profileId);
  return {
    plant,
    displayFlowers,
    freeDisplaySlots: freeSlotsFrom(displayFlowers.map((f) => f.slotIndex)),
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
  if (existing) return toPlantView(existing);

  const created = await prisma.gardenPlant.create({
    data: {
      email,
      profileId,
      seedType,
      gardenSlot: 0,
    },
  });
  return toPlantView(created);
}

export async function waterGardenPlantForProfile(params: {
  email: string;
  profileId: string;
  seedType?: string;
}): Promise<{ ok: true; state: GardenStateView } | { ok: false; error: string; state?: GardenStateView }> {
  const email = normalizeEmail(params.email);
  if (!email) return { ok: false, error: "メールアドレスを確認できませんでした。" };
  const profileId = params.profileId.trim();
  if (!profileId) return { ok: false, error: "プロフィールを確認できませんでした。" };

  const seedType = params.seedType?.trim() || GARDEN_DEFAULT_SEED_TYPE;
  const todayKey = calendarDayKeyInJapanFromDate(new Date());

  const state = await loadGardenStateForProfile({ email, profileId, seedType });
  if (!state.plant.canWater) {
    if (state.plant.isComplete) {
      return { ok: false, error: "このお花はすでに咲いています。", state };
    }
    return { ok: false, error: "今日はもうお水をあげました。", state };
  }

  const nextCount = Math.min(GARDEN_WATER_GOAL, state.plant.waterCount + 1);
  const completedAt = nextCount >= GARDEN_WATER_GOAL ? new Date() : null;

  await prisma.gardenPlant.update({
    where: { id: state.plant.id },
    data: {
      waterCount: nextCount,
      lastWateredOn: todayKey,
      ...(completedAt ? { completedAt, afterBloomChoice: null } : {}),
    },
  });

  const next = await loadGardenStateForProfile({ email, profileId, seedType });
  return { ok: true, state: next };
}

export type GardenBloomChoice = "keep" | "display" | "share";

export async function applyGardenBloomChoice(params: {
  email: string;
  profileId: string;
  choice: GardenBloomChoice;
  slotIndex?: number;
  seedType?: string;
}): Promise<
  | { ok: true; state: GardenStateView; message: string }
  | { ok: false; error: string; state?: GardenStateView }
> {
  const email = normalizeEmail(params.email);
  if (!email) return { ok: false, error: "メールアドレスを確認できませんでした。" };
  const profileId = params.profileId.trim();
  if (!profileId) return { ok: false, error: "プロフィールを確認できませんでした。" };
  const seedType = params.seedType?.trim() || GARDEN_DEFAULT_SEED_TYPE;

  const state = await loadGardenStateForProfile({ email, profileId, seedType });
  if (!state.plant.isComplete) {
    return { ok: false, error: "まだ満開になっていません。", state };
  }

  if (params.choice === "share") {
    return {
      ok: true,
      state,
      message: GARDEN_SHARE_COMING_SOON_MESSAGE,
    };
  }

  if (params.choice === "keep") {
    await prisma.gardenPlant.update({
      where: { id: state.plant.id },
      data: { afterBloomChoice: "keep" },
    });
    const next = await loadGardenStateForProfile({ email, profileId, seedType });
    return { ok: true, state: next, message: GARDEN_KEEP_DONE_MESSAGE };
  }

  // display
  if (state.freeDisplaySlots.length === 0) {
    return { ok: false, error: GARDEN_DISPLAY_SLOTS_FULL_MESSAGE, state };
  }

  const slotIndex =
    typeof params.slotIndex === "number" && state.freeDisplaySlots.includes(params.slotIndex)
      ? params.slotIndex
      : state.freeDisplaySlots[0]!;

  await prisma.$transaction(async (tx) => {
    await tx.gardenDisplayFlower.create({
      data: {
        email,
        profileId,
        slotIndex,
        seedType,
      },
    });
    await tx.gardenPlant.update({
      where: { id: state.plant.id },
      data: {
        waterCount: 0,
        lastWateredOn: null,
        completedAt: null,
        afterBloomChoice: null,
      },
    });
  });

  const next = await loadGardenStateForProfile({ email, profileId, seedType });
  return { ok: true, state: next, message: GARDEN_DISPLAY_DONE_MESSAGE };
}
