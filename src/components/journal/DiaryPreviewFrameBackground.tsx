"use client";

import {
  DIARY_PREVIEW_FRAME_BG_INSET_PX,
  DIARY_PREVIEW_FRAME_PAGE_HEIGHT,
  DIARY_PREVIEW_FRAME_PAGE_WIDTH,
} from "@/lib/journal/diaryPreviewFrameDisplay";

type Props = {
  src: string;
};

/**
 * 製本テンプレ PNG（金枠含む）のみ。オーバーレイとは別レイヤー。
 */
export function DiaryPreviewFrameBackground({ src }: Props) {
  const inset = DIARY_PREVIEW_FRAME_BG_INSET_PX;

  return (
    <div
      className="pointer-events-none absolute z-0"
      style={{
        top: inset.top,
        right: inset.right,
        bottom: inset.bottom,
        left: inset.left,
      }}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={DIARY_PREVIEW_FRAME_PAGE_WIDTH}
        height={DIARY_PREVIEW_FRAME_PAGE_HEIGHT}
        draggable={false}
        className="block select-none"
        style={{
          width: DIARY_PREVIEW_FRAME_PAGE_WIDTH,
          height: DIARY_PREVIEW_FRAME_PAGE_HEIGHT,
        }}
      />
    </div>
  );
}
