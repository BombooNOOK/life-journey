"use client";

import Image from "next/image";
import Link from "next/link";

import { GardenBloomChoicePanel } from "@/components/orders/GardenBloomChoicePanel";
import { GardenMobileImmersive } from "@/components/orders/GardenMobileImmersive";
import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";
import { useGardenWatering } from "@/hooks/useGardenWatering";
import { useLogHouseRoomTimeTheme } from "@/hooks/useLogHouseRoomTimeOfDay";
import {
  GARDEN_BG_BY_TIME,
  GARDEN_WATERING_CAN_SRC,
} from "@/lib/garden/gardenAssets";
import {
  GARDEN_PAGE_DESCRIPTION,
  GARDEN_PAGE_TITLE,
  GARDEN_WATER_BUTTON_LABEL,
} from "@/lib/garden/gardenCopy";
import type { GardenStateView } from "@/lib/garden/gardenPlant";
import { LOG_HOUSE_BACK_TO_LABEL } from "@/lib/journal/logHouseLabels";
import { useIsLogHouseMobileViewport } from "@/lib/loghouse/logHouseViewport";

type Props = {
  initialState: GardenStateView;
};

function GardenDesktopPanel({ initialState }: Props) {
  const { timeOfDay } = useLogHouseRoomTimeTheme();
  const ambientBg = timeOfDay === "night" ? "#1a2430" : "#dfe8d4";
  const {
    plant,
    displayFlowers,
    freeDisplaySlots,
    busy,
    error,
    notice,
    water,
    chooseBloom,
  } = useGardenWatering(initialState);

  return (
    <div className="mx-auto w-full max-w-md space-y-5 sm:space-y-6">
      <MyPageSubpageHeader
        title={GARDEN_PAGE_TITLE}
        description={GARDEN_PAGE_DESCRIPTION}
        backHref="/orders"
        backLabel={LOG_HOUSE_BACK_TO_LABEL}
      />

      <div className="space-y-5">
        <div className="overflow-hidden rounded-2xl border border-[#e8dfd0]/90 bg-[#fffdf9] shadow-sm">
          <div
            className="relative mx-auto aspect-[3/4] max-h-[28rem] w-full overflow-hidden"
            style={{ backgroundColor: ambientBg }}
          >
            {(["day", "night"] as const).map((id) => (
              <Image
                key={id}
                src={GARDEN_BG_BY_TIME[id]}
                alt=""
                fill
                className={[
                  "object-cover object-center transition-opacity duration-700 ease-in-out",
                  timeOfDay === id ? "opacity-100" : "opacity-0",
                ].join(" ")}
                sizes="28rem"
                unoptimized
                priority={id === timeOfDay}
              />
            ))}
            {displayFlowers.map((flower) => {
              const left =
                flower.slotIndex === 1 ? "4%" : flower.slotIndex === 2 ? "72%" : "70%";
              const top =
                flower.slotIndex === 1 ? "28%" : flower.slotIndex === 2 ? "30%" : "52%";
              return (
                <div
                  key={flower.id}
                  className="absolute"
                  style={{ left, top, width: "22%", height: "18%" }}
                >
                  <Image
                    src={flower.plantImageSrc}
                    alt={`飾ったお花（場所 ${flower.slotIndex}）`}
                    fill
                    className="object-contain object-bottom drop-shadow-md"
                    sizes="6rem"
                    unoptimized
                  />
                </div>
              );
            })}
            <div className="absolute inset-x-[18%] bottom-[8%] top-[28%]">
              <Image
                key={plant.plantImageSrc}
                src={plant.plantImageSrc}
                alt={`成長段階 ${plant.stage}`}
                fill
                className="object-contain object-bottom drop-shadow-md"
                sizes="20rem"
                unoptimized
              />
            </div>
          </div>

          <div className="space-y-3 border-t border-[#ebe4d8]/80 px-4 py-4">
            {plant.showBloomChoices ? (
              <GardenBloomChoicePanel
                busy={busy}
                freeDisplaySlots={freeDisplaySlots}
                onChoose={(choice, slotIndex) => void chooseBloom(choice, slotIndex)}
              />
            ) : (
              <>
                <p className="text-center text-sm leading-relaxed text-stone-700">
                  {plant.comment}
                </p>
                <p className="text-center text-sm text-stone-700">{plant.progressPrimary}</p>
                <p className="whitespace-pre-line text-center text-xs text-stone-500">
                  {plant.progressSecondary}
                </p>
                {!plant.isComplete ? (
                  <p className="text-center text-sm text-stone-600">{plant.statusLabel}</p>
                ) : null}
                {plant.softMessage && !plant.isComplete ? (
                  <p className="text-center text-sm leading-relaxed text-emerald-900/90">
                    {plant.softMessage}
                  </p>
                ) : null}
              </>
            )}
            {notice ? (
              <p
                className="whitespace-pre-line text-center text-sm leading-relaxed text-emerald-900"
                role="status"
              >
                {notice}
              </p>
            ) : null}
          </div>
        </div>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}

        {!plant.isComplete ? (
          <button
            type="button"
            disabled={!plant.canWater || busy}
            onClick={() => void water()}
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-emerald-300/80 bg-emerald-50/90 px-4 text-base font-semibold text-emerald-950 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {busy ? (
              <OwlLoadingInline label="お水をあげています…" size="sm" />
            ) : (
              <>
                <span className="relative h-8 w-8 shrink-0">
                  <Image
                    src={GARDEN_WATERING_CAN_SRC}
                    alt=""
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </span>
                {GARDEN_WATER_BUTTON_LABEL}
              </>
            )}
          </button>
        ) : null}
      </div>

      <p>
        <Link href="/orders/go-out" className="text-sm text-stone-600 hover:text-stone-900">
          ← おでかけに戻る
        </Link>
      </p>
    </div>
  );
}

/** お庭：PCはカードUI、モバイルは没入タップ水やり */
export function GardenPageClient({ initialState }: Props) {
  const isMobile = useIsLogHouseMobileViewport();

  if (isMobile) {
    return <GardenMobileImmersive initialState={initialState} />;
  }

  return <GardenDesktopPanel initialState={initialState} />;
}
