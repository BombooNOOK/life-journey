"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";

import { OwlLoadingPanel } from "@/components/ui/OwlLoadingPanel";
import "@/lib/journal/diaryPreviewLabelFont";
import {
  FOREST_DIRECTION_SIGN_DESIGN_SIZE,
  FOREST_DIRECTION_SIGN_SRC,
  forestDirectionSignLabelStyle,
  type ForestDirectionSignLabelPlacement,
} from "@/lib/onboarding/forestDirectionSignLayout";

type Props = {
  label: string;
  placement?: ForestDirectionSignLabelPlacement;
  className?: string;
  ariaLabel?: string;
  onFigureClick?: (coords: { x: number; y: number }) => void;
  debugPin?: { x: number; y: number } | null;
  onImageReady?: () => void;
  /** true のとき看板ラベルで改行を保持 */
  multiline?: boolean;
};

function useForestDirectionSignScale() {
  const ref = useRef<HTMLElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const sync = () => {
      const width = el.getBoundingClientRect().width;
      if (width > 0) {
        setScale(width / FOREST_DIRECTION_SIGN_DESIGN_SIZE.widthPx);
      }
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, scale };
}

/** 森の一本矢印看板：PNG 上に行き先名を重ねる */
export function ForestDirectionSignBoard({
  label,
  placement,
  className = "",
  ariaLabel,
  onFigureClick,
  debugPin = null,
  onImageReady,
  multiline = false,
}: Props) {
  const { widthPx, heightPx } = FOREST_DIRECTION_SIGN_DESIGN_SIZE;
  const displayLabel = multiline ? label : label.replace(/\n/g, "");
  const { ref, scale } = useForestDirectionSignScale();
  const [imageReady, setImageReady] = useState(false);

  const handleImageReady = () => {
    setImageReady(true);
    onImageReady?.();
  };

  const handleFigureClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!onFigureClick) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * widthPx);
    const y = Math.round(((event.clientY - rect.top) / rect.height) * heightPx);
    onFigureClick({ x, y });
  };

  return (
    <figure
      ref={ref}
      className={`relative mx-auto aspect-square w-full max-w-[min(100%,18rem)] sm:max-w-[20rem] ${onFigureClick ? "cursor-crosshair" : ""} ${className}`.trim()}
      aria-label={ariaLabel ?? `行き先：${displayLabel}`}
      onClick={onFigureClick ? handleFigureClick : undefined}
    >
      {!imageReady ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <OwlLoadingPanel
            layout="section"
            size="sm"
            label="案内を準備しています…"
            className="py-6"
          />
        </div>
      ) : null}
      <Image
        src={FOREST_DIRECTION_SIGN_SRC}
        alt=""
        aria-hidden
        width={widthPx}
        height={heightPx}
        sizes="(max-width: 640px) 72vw, 320px"
        className={`h-full w-full select-none object-contain ${imageReady ? "" : "opacity-0"}`}
        priority
        onLoad={handleImageReady}
        onError={handleImageReady}
      />
      {imageReady ? (
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden [text-shadow:0_1px_0_rgba(255,251,245,0.7)]"
          aria-hidden
        >
          <p
            className={`m-0 leading-[inherit] text-[color:inherit] ${multiline ? "whitespace-pre-line" : "whitespace-nowrap"}`}
            style={forestDirectionSignLabelStyle(placement, scale)}
          >
            {displayLabel}
          </p>
          {debugPin ? (
            <>
              <span
                className="pointer-events-none absolute z-10 h-2.5 w-2.5 rounded-full bg-emerald-600 ring-2 ring-white"
                style={{ left: debugPin.x * scale, top: debugPin.y * scale }}
                aria-hidden
              />
              <span
                className="pointer-events-none absolute z-10 rounded bg-stone-900/85 px-1.5 py-0.5 text-[10px] text-white"
                style={{
                  left: debugPin.x * scale,
                  top: debugPin.y * scale,
                  transform: "translate(4px, 4px)",
                }}
                aria-hidden
              >
                {debugPin.x},{debugPin.y}
              </span>
            </>
          ) : null}
        </div>
      ) : null}
    </figure>
  );
}
