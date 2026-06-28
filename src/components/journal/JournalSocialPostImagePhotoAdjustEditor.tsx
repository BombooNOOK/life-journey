"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  buildPhotoCropSlotPreviewLayout,
  clampJournalSocialPostPhotoAdjustFocus,
  computeNormalizedPhotoCropFrame,
  DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST,
  isDefaultJournalSocialPostPhotoAdjust,
  JOURNAL_SOCIAL_POST_PHOTO_SCALE_MAX,
  JOURNAL_SOCIAL_POST_PHOTO_SCALE_MIN,
  normalizeJournalSocialPostPhotoAdjust,
  photoAdjustFocusDeltaFromDrag,
  type JournalSocialPostPhotoAdjust,
} from "@/lib/journal/social-post-image/photoAdjust";

type Props = {
  photoSrc: string;
  targetWidth: number;
  targetHeight: number;
  adjust: JournalSocialPostPhotoAdjust;
  onChange: (adjust: JournalSocialPostPhotoAdjust) => void;
  onReset: () => void;
  /** 下のプレビューへ反映（未反映の変更があるときだけ有効） */
  onApply?: () => void;
  hasPendingApply?: boolean;
  applyingPreview?: boolean;
};

export function JournalSocialPostImagePhotoAdjustEditor({
  photoSrc,
  targetWidth,
  targetHeight,
  adjust,
  onChange,
  onReset,
  onApply,
  hasPendingApply = false,
  applyingPreview = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startFocusX: number;
    startFocusY: number;
    startClientX: number;
    startClientY: number;
  } | null>(null);
  const [sourceSize, setSourceSize] = useState({ width: 720, height: 720 });
  const [containerWidth, setContainerWidth] = useState(320);

  const normalized = normalizeJournalSocialPostPhotoAdjust(adjust);
  const frame = computeNormalizedPhotoCropFrame({
    targetWidth,
    targetHeight,
    adjust: normalized,
  });
  const previewLayout = buildPhotoCropSlotPreviewLayout({
    sourceWidth: sourceSize.width,
    sourceHeight: sourceSize.height,
    squareFrame: frame,
    containerWidth,
  });
  const slotBorderRadiusPx =
    targetWidth >= 700 ? 24 : targetWidth >= 400 ? 12 : 8;

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setSourceSize({ width: img.naturalWidth, height: img.naturalHeight });
      }
    };
    img.src = photoSrc;
  }, [photoSrc]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0) {
        setContainerWidth(rect.width);
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [targetWidth, targetHeight]);

  const updateFocus = useCallback(
    (focusX: number, focusY: number) => {
      const clamped = clampJournalSocialPostPhotoAdjustFocus({
        focusX,
        focusY,
        targetWidth,
        targetHeight,
        scale: normalized.scale,
      });
      onChange({ ...normalized, ...clamped });
    },
    [normalized, onChange, targetHeight, targetWidth],
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    dragRef.current = {
      pointerId: event.pointerId,
      startFocusX: normalized.focusX,
      startFocusY: normalized.focusY,
      startClientX: event.clientX,
      startClientY: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const container = containerRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !container) return;

    const rect = container.getBoundingClientRect();
    const { deltaFocusX, deltaFocusY } = photoAdjustFocusDeltaFromDrag({
      deltaX: event.clientX - drag.startClientX,
      deltaY: event.clientY - drag.startClientY,
      containerWidth: rect.width,
      containerHeight: rect.height,
      frameWidth: frame.width,
      frameHeight: frame.height,
    });
    updateFocus(drag.startFocusX + deltaFocusX, drag.startFocusY + deltaFocusY);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleScaleChange = (scale: number) => {
    const next = normalizeJournalSocialPostPhotoAdjust({ ...normalized, scale });
    const clamped = clampJournalSocialPostPhotoAdjustFocus({
      focusX: next.focusX,
      focusY: next.focusY,
      targetWidth,
      targetHeight,
      scale: next.scale,
    });
    onChange({ ...next, ...clamped });
  };

  return (
    <div className="space-y-3 rounded-lg border border-stone-200 bg-stone-50/80 p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-stone-800">写真の位置・拡大</p>
          <p className="mt-1 text-xs leading-relaxed text-stone-500">
            上の枠で位置と拡大を調整し、「プレビューに反映」で下の投稿画像を更新します。
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={isDefaultJournalSocialPostPhotoAdjust(normalized)}
          className="min-h-[36px] rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          リセット
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative mx-auto w-full max-w-[320px] cursor-grab touch-none select-none overflow-hidden border border-stone-300 bg-stone-200 active:cursor-grabbing"
        style={{
          aspectRatio: `${targetWidth} / ${targetHeight}`,
          borderRadius: slotBorderRadiusPx,
          backgroundImage: `url(${photoSrc})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${previewLayout.displayWidth}px auto`,
          backgroundPosition: `${previewLayout.left}px ${previewLayout.top}px`,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="img"
        aria-label="投稿画像用の写真調整プレビュー"
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] ring-2 ring-inset ring-white/80"
          aria-hidden
        />
      </div>

      <p className="text-center text-xs text-stone-500">写真をドラッグして位置を調整</p>

      <label className="block space-y-2">
        <span className="text-xs font-medium text-stone-600">
          拡大（{normalized.scale.toFixed(2)}×）
        </span>
        <input
          type="range"
          min={JOURNAL_SOCIAL_POST_PHOTO_SCALE_MIN}
          max={JOURNAL_SOCIAL_POST_PHOTO_SCALE_MAX}
          step={0.01}
          value={normalized.scale}
          onChange={(event) => handleScaleChange(Number(event.target.value))}
          className="w-full accent-stone-700"
        />
      </label>

      {onApply ? (
        <div className="space-y-2 pt-1">
          {hasPendingApply ? (
            <p className="text-xs text-amber-800">
              位置・拡大の変更は、まだ下のプレビューに反映されていません。
            </p>
          ) : (
            <p className="text-xs text-stone-500">下のプレビューと同じ設定です。</p>
          )}
          <button
            type="button"
            onClick={onApply}
            disabled={!hasPendingApply || applyingPreview}
            className="min-h-[44px] w-full rounded-md border border-stone-700 bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-900 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-200 disabled:text-stone-500"
          >
            {applyingPreview ? "プレビューを更新中…" : "プレビューに反映"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export { DEFAULT_JOURNAL_SOCIAL_POST_PHOTO_ADJUST };
