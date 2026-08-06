import type { CSSProperties } from "react";

import type { LogHouseRoomCoverFocus } from "@/lib/loghouse/logHouseRoomCoverFocus";

export type LogHouseRoomStageSize = {
  widthPx: number;
  heightPx: number;
};

export type LogHouseRoomViewportBox = {
  width: number;
  height: number;
};

/** cover 時にこの倍率を超えて縦がはみ出すなら contain（全体が見える）へ */
export const LOG_HOUSE_ROOM_CONTAIN_CROP_THRESHOLD = 1.12;

export function logHouseRoomArtRatio(size: LogHouseRoomStageSize): number {
  return size.widthPx / size.heightPx;
}

/** cover だと上下がどれだけ切れるか（1 = 切れない） */
export function logHouseRoomCoverCropRatio(
  size: LogHouseRoomStageSize,
  box: LogHouseRoomViewportBox,
): number {
  if (box.width <= 0 || box.height <= 0) return 1;
  const ratio = logHouseRoomArtRatio(size);
  const coverHeight = Math.max(box.height, box.width / ratio);
  return coverHeight / box.height;
}

export function shouldContainLogHouseRoomStage(
  size: LogHouseRoomStageSize,
  box: LogHouseRoomViewportBox,
  threshold: number = LOG_HOUSE_ROOM_CONTAIN_CROP_THRESHOLD,
): boolean {
  return logHouseRoomCoverCropRatio(size, box) > threshold;
}

export function resolveLogHouseRoomStageBoxStyle(params: {
  size: LogHouseRoomStageSize;
  box: LogHouseRoomViewportBox;
  mode: "cover" | "contain";
  focus?: LogHouseRoomCoverFocus | null;
  /**
   * ツアーのパン用。初回レイアウト確定前は false（計測直後の left/transform 遷移で
   * 左寄りのポストが左端→定位置に動いて見えるのを防ぐ）
   */
  animatePan?: boolean;
}): CSSProperties {
  const { size, box, mode, focus = null, animatePan = true } = params;
  if (box.width <= 0 || box.height <= 0) {
    // 計測前は空シェルのみ（子どもはマウントしない前提）
    return {
      position: "absolute",
      inset: 0,
      visibility: "hidden",
    };
  }

  const ratio = logHouseRoomArtRatio(size);
  // ツアーのパンだけ滑らかに。width/height を含めると初回計測・リサイズで揺れる
  const transition = animatePan
    ? "top 420ms ease, bottom 420ms ease, left 420ms ease, transform 420ms ease"
    : undefined;

  if (mode === "contain") {
    const width = Math.min(box.width, box.height * ratio);
    const height = Math.min(box.height, box.width / ratio);
    return {
      position: "absolute",
      left: "50%",
      top: "50%",
      width,
      height,
      transform: "translate(-50%, -50%)",
      transition,
    };
  }

  const width = Math.max(box.width, box.height * ratio);
  const height = Math.max(box.height, box.width / ratio);
  const xPct = focus?.xPct ?? 50;

  if (focus?.align === "bottom") {
    return {
      position: "absolute",
      left: "50%",
      bottom: 0,
      top: "auto",
      width,
      height,
      transform: `translateX(-${xPct}%)`,
      transition,
    };
  }

  if (focus?.align === "top") {
    return {
      position: "absolute",
      left: "50%",
      top: 0,
      bottom: "auto",
      width,
      height,
      transform: `translateX(-${xPct}%)`,
      transition,
    };
  }

  return {
    position: "absolute",
    left: "50%",
    top: "50%",
    bottom: "auto",
    width,
    height,
    transform: `translate(-${xPct}%, -50%)`,
    transition,
  };
}
