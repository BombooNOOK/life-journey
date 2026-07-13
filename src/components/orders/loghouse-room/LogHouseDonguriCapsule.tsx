"use client";

import Image from "next/image";

import { DONGURI_ICON_SRC } from "@/lib/loghouse/donguriAssets";
import {
  DONGURI_CAPSULE_ARIA_LABEL,
  DONGURI_HINT_DESCRIPTION,
  DONGURI_HINT_LABEL,
} from "@/lib/loghouse/donguriCopy";

type Props = {
  balance: number;
  onOpen: () => void;
  showHintLabel?: boolean;
  timeOfDay?: "day" | "night";
};

/** 地図横：どんぐり所持の小さなカプセル */
export function LogHouseDonguriCapsule({
  balance,
  onOpen,
  showHintLabel = false,
  timeOfDay = "day",
}: Props) {
  const night = timeOfDay === "night";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`${DONGURI_CAPSULE_ARIA_LABEL}（${balance}）`}
        title={DONGURI_CAPSULE_ARIA_LABEL}
        className={[
          "inline-flex h-11 min-w-[4.5rem] items-center gap-1.5 rounded-full border px-2.5 shadow-sm backdrop-blur-[3px] transition active:scale-[0.98]",
          night
            ? "border-stone-200/35 bg-[#fffdf9]/82 text-stone-800 hover:bg-[#fffdf9]/92"
            : "border-stone-500/20 text-stone-700 hover:brightness-[1.03]",
        ].join(" ")}
        style={
          night
            ? undefined
            : { backgroundColor: "rgba(245, 236, 220, 0.72)" }
        }
      >
        <Image
          src={DONGURI_ICON_SRC}
          alt=""
          width={22}
          height={22}
          className="h-[22px] w-[22px] shrink-0 object-contain"
          unoptimized
          aria-hidden
        />
        <span className="pr-0.5 text-sm font-semibold tabular-nums tracking-wide text-stone-800">
          {balance}
        </span>
      </button>

      {showHintLabel ? (
        <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2">
          <span className="inline-block max-w-[9.5rem] rounded-full bg-[#fffdf9]/9 px-2.5 py-0.5 text-center text-[10px] font-medium leading-snug tracking-wide text-stone-700 shadow-sm ring-1 ring-stone-300/35">
            {DONGURI_HINT_LABEL}
            <span className="mt-0.5 block font-normal text-stone-500">{DONGURI_HINT_DESCRIPTION}</span>
          </span>
        </span>
      ) : null}
    </div>
  );
}
