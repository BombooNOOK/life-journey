"use client";

import type { ReactNode } from "react";

import { LOG_HOUSE_ROOM_SPOT_COPY } from "@/lib/loghouse/logHouseRoomCopy";
import type { LogHouseRoomHotspot } from "@/lib/loghouse/logHouseRoomHotspots";

type Props = {
  spot: LogHouseRoomHotspot;
  onActivate: () => void;
  disabled?: boolean;
  /** プレビュー用：タップ枠を半透明で表示 */
  showDebugOutline?: boolean;
  /** ヒントモード：小さめ半透明ラベル */
  showHintLabel?: boolean;
  /** タップ直後のふわっと光 */
  flash?: boolean;
  /** はじめて案内：次にタップしてほしい場所の継続ハイライト */
  spotlight?: boolean;
  /** ヒント／スポットライト時のラベル上書き */
  hintLabelOverride?: string | null;
  children?: ReactNode;
};

function hintLabelPositionClass(align: LogHouseRoomHotspot["hintLabelAlign"]): string {
  // end: 右寄りの家具はホットスポット中央から左へ伸ばし、画面外切れを防ぐ
  // start: 左端家具は少し右へずらし、画面外切れを防ぐ（本棚など）
  if (align === "start") return "left-3";
  if (align === "end") return "right-1/2";
  return "left-1/2 -translate-x-1/2";
}

function hintLabelEdgeClass(edge: LogHouseRoomHotspot["hintLabelEdge"]): string {
  if (edge === "inside-top") return "top-1";
  if (edge === "above") return "bottom-full mb-1";
  if (edge === "below") return "top-full mt-1";
  return "bottom-1";
}

/** 室内の家具タップ領域（通常は透明・景観優先） */
export function LogHouseRoomTapSpot({
  spot,
  onActivate,
  disabled = false,
  showDebugOutline = false,
  showHintLabel = false,
  flash = false,
  spotlight = false,
  hintLabelOverride = null,
  children,
}: Props) {
  const copy = LOG_HOUSE_ROOM_SPOT_COPY[spot.id];
  const label = hintLabelOverride?.trim() || copy.label;
  const showLabel = showHintLabel || spotlight;

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={`${label}：${copy.description}`}
      onClick={onActivate}
      className={[
        "absolute z-[24] rounded-xl border-2 transition duration-200",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700",
        disabled
          ? "cursor-not-allowed border-transparent opacity-40"
          : showDebugOutline
            ? "border-blue-400/55 border-dashed bg-blue-50/10 hover:border-amber-200/50 hover:bg-amber-50/15 active:scale-[0.99]"
            : "border-transparent bg-transparent hover:bg-amber-50/10 active:scale-[0.99]",
        flash || spotlight
          ? "border-amber-200/80 bg-amber-100/35 shadow-[0_0_24px_rgba(251,191,36,0.35)]"
          : "",
        spotlight ? "animate-pulse" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        left: `${spot.x}%`,
        top: `${spot.y}%`,
        width: `${spot.width}%`,
        height: `${spot.height}%`,
      }}
    >
      {showLabel ? (
        <span
          className={[
            "pointer-events-none absolute z-10",
            hintLabelEdgeClass(spot.hintLabelEdge),
            hintLabelPositionClass(spot.hintLabelAlign),
          ].join(" ")}
        >
          <span className="inline-block whitespace-nowrap rounded-full bg-[#fffdf9]/72 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-stone-700 shadow-sm ring-1 ring-stone-300/35 backdrop-blur-[2px]">
            {label}
          </span>
        </span>
      ) : null}
      {children}
    </button>
  );
}
