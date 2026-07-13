"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { buildGardenPreviewPlant } from "@/lib/garden/gardenPreviewFixture";
import type {
  GardenBloomChoice,
  GardenDisplayFlowerView,
  GardenPlantView,
  GardenStateView,
} from "@/lib/garden/gardenPlant";

type UseGardenWateringResult = {
  plant: GardenPlantView;
  displayFlowers: GardenDisplayFlowerView[];
  freeDisplaySlots: number[];
  busy: boolean;
  error: string | null;
  notice: string | null;
  water: () => Promise<void>;
  chooseBloom: (choice: GardenBloomChoice, slotIndex?: number) => Promise<void>;
  clearNotice: () => void;
};

type Options = {
  /** ログイン不要プレビュー：APIなしで段階を進められる */
  previewMode?: boolean;
};

function asState(plant: GardenPlantView, displayFlowers: GardenDisplayFlowerView[] = []): GardenStateView {
  const occupied = new Set(displayFlowers.map((f) => f.slotIndex));
  const freeDisplaySlots = [1, 2, 3].filter((slot) => !occupied.has(slot));
  return { plant, displayFlowers, freeDisplaySlots };
}

/** お庭の水やり・満開後選択（PC・モバイル共用） */
export function useGardenWatering(
  initialState: GardenStateView,
  options: Options = {},
): UseGardenWateringResult {
  const router = useRouter();
  const previewMode = options.previewMode === true;
  const [state, setState] = useState(initialState);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setState(initialState);
  }, [initialState]);

  const clearNotice = useCallback(() => {
    setNotice(null);
    setError(null);
  }, []);

  const water = useCallback(async () => {
    if (busy) return;

    if (previewMode) {
      if (state.plant.isComplete) {
        setNotice(state.plant.softMessage ?? state.plant.statusLabel);
        return;
      }
      const nextPlant = buildGardenPreviewPlant(state.plant.waterCount + 1);
      nextPlant.canWater = !nextPlant.isComplete;
      nextPlant.wateredToday = false;
      nextPlant.showBloomChoices = nextPlant.isComplete;
      setState(asState(nextPlant, state.displayFlowers));
      setNotice(
        nextPlant.isComplete
          ? (nextPlant.softMessage ?? nextPlant.progressPrimary)
          : nextPlant.progressPrimary,
      );
      return;
    }

    if (!state.plant.canWater) {
      setNotice(state.plant.softMessage ?? state.plant.statusLabel);
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/garden/plant", { method: "POST" });
      const json = (await res.json()) as GardenStateView & { error?: string };
      if (!res.ok || !json.plant) {
        setError(json.error ?? "お水をあげられませんでした。");
        if (json.plant) {
          setState({
            plant: json.plant,
            displayFlowers: json.displayFlowers ?? state.displayFlowers,
            freeDisplaySlots: json.freeDisplaySlots ?? state.freeDisplaySlots,
          });
        }
        return;
      }
      setState({
        plant: json.plant,
        displayFlowers: json.displayFlowers ?? [],
        freeDisplaySlots: json.freeDisplaySlots ?? [],
      });
      setNotice(json.plant.softMessage ?? json.plant.statusLabel);
      router.refresh();
    } catch {
      setError("お水をあげられませんでした。時間をおいて再度お試しください。");
    } finally {
      setBusy(false);
    }
  }, [busy, previewMode, router, state.displayFlowers, state.freeDisplaySlots, state.plant]);

  const chooseBloom = useCallback(
    async (choice: GardenBloomChoice, slotIndex?: number) => {
      if (busy) return;

      if (previewMode) {
        if (choice === "share") {
          setNotice(
            "クマくんのショップにお花をおすそわけすると、\nお礼にどんぐりがもらえます。\n\nいまは準備中です。もうしばらくお待ちください。",
          );
          return;
        }
        if (choice === "keep") {
          const plant = {
            ...state.plant,
            afterBloomChoice: "keep" as const,
            showBloomChoices: true,
          };
          setState(asState(plant, state.displayFlowers));
          setNotice(
            "このまま、もう少し眺めておくことにしました。\nお花はいつでも飾ることができます。",
          );
          return;
        }
        if (state.freeDisplaySlots.length === 0) {
          setError("飾る場所がいっぱいです");
          return;
        }
        const slot = slotIndex ?? state.freeDisplaySlots[0]!;
        const flower: GardenDisplayFlowerView = {
          id: `preview-display-${slot}`,
          slotIndex: slot,
          seedType: "default",
          plantImageSrc: state.plant.plantImageSrc,
        };
        const nextFlowers = [...state.displayFlowers, flower];
        setState(asState(buildGardenPreviewPlant(0), nextFlowers));
        setNotice(
          "お花をお庭に飾りました。\nログハウスのそばに、またひとつ思い出が増えました。",
        );
        return;
      }

      setBusy(true);
      setError(null);
      setNotice(null);
      try {
        const res = await fetch("/api/garden/bloom-choice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ choice, slotIndex }),
        });
        const json = (await res.json()) as GardenStateView & {
          error?: string;
          message?: string;
        };
        if (!res.ok) {
          setError(json.error ?? "選択を保存できませんでした。");
          if (json.plant) {
            setState({
              plant: json.plant,
              displayFlowers: json.displayFlowers ?? state.displayFlowers,
              freeDisplaySlots: json.freeDisplaySlots ?? state.freeDisplaySlots,
            });
          }
          return;
        }
        if (json.plant) {
          setState({
            plant: json.plant,
            displayFlowers: json.displayFlowers ?? [],
            freeDisplaySlots: json.freeDisplaySlots ?? [],
          });
        }
        if (json.message) setNotice(json.message);
        router.refresh();
      } catch {
        setError("選択を保存できませんでした。時間をおいて再度お試しください。");
      } finally {
        setBusy(false);
      }
    },
    [busy, previewMode, router, state.displayFlowers, state.freeDisplaySlots, state.plant],
  );

  return {
    plant: state.plant,
    displayFlowers: state.displayFlowers,
    freeDisplaySlots: state.freeDisplaySlots,
    busy,
    error,
    notice,
    water,
    chooseBloom,
    clearNotice,
  };
}
