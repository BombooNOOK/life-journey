"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, type CSSProperties } from "react";

import { useGardenWatering } from "@/hooks/useGardenWatering";
import {
  GARDEN_BG_INTRINSIC,
  GARDEN_BG_SRC,
  GARDEN_WATERING_CAN_SRC,
} from "@/lib/garden/gardenAssets";
import { GARDEN_PAGE_TITLE, GARDEN_WATER_BUTTON_LABEL } from "@/lib/garden/gardenCopy";
import {
  GARDEN_MOBILE_PLANT_PLACEMENT,
  GARDEN_MOBILE_WATERING_CAN_PLACEMENT,
} from "@/lib/garden/gardenMobileLayout";
import type { GardenPlantView } from "@/lib/garden/gardenPlant";
import { LOG_HOUSE_BACK_TO_LABEL } from "@/lib/journal/logHouseLabels";

type Props = {
  initialPlant: GardenPlantView;
  /** ログイン不要プレビュー（APIなし・連続水やり可） */
  previewMode?: boolean;
  backHref?: string;
  /** framed = 576×1024 全体が見える枠（プレビュー向け） */
  layout?: "immersive" | "framed";
};

/** 庭全体が画面に収まる（切り抜かない） */
function containStageStyle(size: { widthPx: number; heightPx: number }): CSSProperties {
  const ratio = size.widthPx / size.heightPx;
  return {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: `min(100vw, calc(100dvh * ${ratio}))`,
    height: `min(100dvh, calc(100vw / ${ratio}))`,
    transform: "translate(-50%, -50%)",
  };
}

function GardenStage({
  plant,
  busy,
  onWater,
}: {
  plant: GardenPlantView;
  busy: boolean;
  onWater: () => void;
}) {
  const plantBox = GARDEN_MOBILE_PLANT_PLACEMENT;
  const canBox = GARDEN_MOBILE_WATERING_CAN_PLACEMENT;

  return (
    <>
      <Image
        src={GARDEN_BG_SRC}
        alt=""
        fill
        priority
        sizes="100vw"
        className="z-0 object-contain object-center"
        draggable={false}
        unoptimized
      />

      <div
        className="pointer-events-none absolute z-10"
        style={{
          left: `${plantBox.x}%`,
          top: `${plantBox.y}%`,
          width: `${plantBox.width}%`,
          height: `${plantBox.height}%`,
        }}
      >
        <Image
          key={plant.plantImageSrc}
          src={plant.plantImageSrc}
          alt={`成長段階 ${plant.stage}`}
          fill
          className="object-contain object-bottom drop-shadow-sm"
          sizes="60vw"
          unoptimized
        />
      </div>

      <button
        type="button"
        disabled={busy}
        aria-label={
          plant.canWater ? GARDEN_WATER_BUTTON_LABEL : (plant.softMessage ?? plant.statusLabel)
        }
        onClick={onWater}
        className={[
          "absolute z-20 rounded-2xl border-2 border-transparent transition duration-200",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700",
          plant.canWater ? "hover:brightness-105 active:scale-[0.97]" : "opacity-80",
          busy ? "opacity-60" : "",
        ].join(" ")}
        style={{
          left: `${canBox.x}%`,
          top: `${canBox.y}%`,
          width: `${canBox.width}%`,
          height: `${canBox.height}%`,
        }}
      >
        <Image
          src={GARDEN_WATERING_CAN_SRC}
          alt=""
          fill
          className="pointer-events-none object-contain object-bottom"
          sizes="40vw"
          unoptimized
        />
      </button>
    </>
  );
}

/** スマホ：お庭背景＋植木鉢＋ジョウロタップで水やり（庭全体が見える） */
export function GardenMobileImmersive({
  initialPlant,
  previewMode = false,
  backHref = "/orders",
  layout = "immersive",
}: Props) {
  const { plant, busy, error, notice, water, clearNotice } = useGardenWatering(initialPlant, {
    previewMode,
  });

  useEffect(() => {
    if (!notice && !error) return;
    const timer = window.setTimeout(() => {
      clearNotice();
    }, 4200);
    return () => window.clearTimeout(timer);
  }, [clearNotice, error, notice]);

  const chrome = (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto flex items-start justify-between gap-2">
          <Link
            href={backHref}
            className="inline-flex min-h-[40px] items-center rounded-full border border-stone-500/20 bg-[#fffdf9]/75 px-3 text-xs font-medium text-stone-700 shadow-sm backdrop-blur-[3px]"
          >
            ← {previewMode ? "プレビュー一覧" : LOG_HOUSE_BACK_TO_LABEL}
          </Link>
          <p className="rounded-full border border-stone-500/15 bg-[#fffdf9]/7 px-3 py-2 text-xs font-medium text-stone-700 shadow-sm backdrop-blur-[2px]">
            {GARDEN_PAGE_TITLE}
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-sm space-y-2 rounded-2xl border border-stone-200/70 bg-[#fffdf9]/88 px-3.5 py-3 text-center shadow-lg backdrop-blur-[2px]">
          <p className="text-sm leading-relaxed text-stone-700">{plant.comment}</p>
          <p className="text-xs text-stone-600">{plant.progressPrimary}</p>
          <p className="text-xs text-stone-500">{plant.progressSecondary}</p>
          {!plant.isComplete ? (
            <p className="text-xs text-stone-600">{plant.statusLabel}</p>
          ) : null}
          {plant.canWater ? (
            <p className="text-[11px] text-emerald-900/80">ジョウロをタップしてお水をあげられます</p>
          ) : null}
          {notice ? (
            <p className="text-sm leading-relaxed text-emerald-900" role="status">
              {notice}
            </p>
          ) : null}
          {error ? (
            <p className="text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </>
  );

  if (layout === "framed") {
    return (
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center px-3 py-6">
        <div
          className="relative w-full overflow-hidden rounded-2xl border border-stone-200/90 shadow-sm"
          style={{
            aspectRatio: `${GARDEN_BG_INTRINSIC.widthPx} / ${GARDEN_BG_INTRINSIC.heightPx}`,
            backgroundColor: "#dfe8d4",
          }}
        >
          <div className="absolute inset-0 isolate overflow-hidden">
            <GardenStage plant={plant} busy={busy} onWater={() => void water()} />
          </div>
          {chrome}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] overflow-hidden overscroll-none select-none"
      style={{ touchAction: "none", backgroundColor: "#dfe8d4" }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="relative isolate overflow-hidden"
          style={containStageStyle(GARDEN_BG_INTRINSIC)}
        >
          <GardenStage plant={plant} busy={busy} onWater={() => void water()} />
        </div>
      </div>
      {chrome}
    </div>
  );
}
