"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { buildGardenPreviewPlant } from "@/lib/garden/gardenPreviewFixture";
import type { GardenPlantView } from "@/lib/garden/gardenPlant";

type UseGardenWateringResult = {
  plant: GardenPlantView;
  busy: boolean;
  error: string | null;
  notice: string | null;
  water: () => Promise<void>;
  clearNotice: () => void;
};

type Options = {
  /** ログイン不要プレビュー：APIなしで段階を進められる */
  previewMode?: boolean;
};

/** お庭の水やり API 呼び出し（PC・モバイル共用） */
export function useGardenWatering(
  initialPlant: GardenPlantView,
  options: Options = {},
): UseGardenWateringResult {
  const router = useRouter();
  const previewMode = options.previewMode === true;
  const [plant, setPlant] = useState(initialPlant);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setPlant(initialPlant);
  }, [initialPlant]);

  const clearNotice = useCallback(() => {
    setNotice(null);
    setError(null);
  }, []);

  const water = useCallback(async () => {
    if (busy) return;

    if (previewMode) {
      if (plant.isComplete) {
        setNotice(plant.softMessage ?? plant.statusLabel);
        return;
      }
      const next = buildGardenPreviewPlant(plant.waterCount + 1);
      // プレビューでは連続タップで成長確認できるようにする
      next.canWater = !next.isComplete;
      next.wateredToday = false;
      next.statusLabel = next.isComplete
        ? next.statusLabel
        : "今日はまだお水をあげていません";
      next.softMessage = next.isComplete ? next.softMessage : null;
      setPlant(next);
      setNotice(
        next.isComplete
          ? (next.softMessage ?? next.progressPrimary)
          : next.progressPrimary,
      );
      return;
    }

    if (!plant.canWater) {
      setNotice(plant.softMessage ?? plant.statusLabel);
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/garden/plant", { method: "POST" });
      const json = (await res.json()) as { plant?: GardenPlantView; error?: string };
      if (!res.ok || !json.plant) {
        setError(json.error ?? "お水をあげられませんでした。");
        if (json.plant) setPlant(json.plant);
        return;
      }
      setPlant(json.plant);
      setNotice(json.plant.softMessage ?? json.plant.statusLabel);
      router.refresh();
    } catch {
      setError("お水をあげられませんでした。時間をおいて再度お試しください。");
    } finally {
      setBusy(false);
    }
  }, [busy, plant, previewMode, router]);

  return { plant, busy, error, notice, water, clearNotice };
}
