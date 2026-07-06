"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";

import { OwlLoadingPanel } from "@/components/ui/OwlLoadingPanel";
import "@/lib/journal/diaryPreviewLabelFont";
import {
  FIRST_VISIT_RESIDENT_REGISTRATION_OWL_FRAME_DESIGN_SIZE,
  FIRST_VISIT_RESIDENT_REGISTRATION_OWL_FRAME_SRC,
  firstVisitOwlFrameLabelStyle,
  type FirstVisitOwlFrameLabelPlacement,
} from "@/lib/onboarding/firstVisitResidentRegistrationFrameLayout";

type Props = {
  label: string;
  src?: string;
  placement?: FirstVisitOwlFrameLabelPlacement;
  className?: string;
  ariaLabel?: string;
  onImageReady?: () => void;
  onFigureClick?: (coords: { x: number; y: number }) => void;
  debugPin?: { x: number; y: number } | null;
};

function useOwlCommentFrameScale() {
  const ref = useRef<HTMLElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const sync = () => {
      const width = el.getBoundingClientRect().width;
      if (width > 0) {
        setScale(width / FIRST_VISIT_RESIDENT_REGISTRATION_OWL_FRAME_DESIGN_SIZE.widthPx);
      }
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, scale };
}

/** フクロウ先生コメント枠：PNG 上にテキストを重ねる */
export function OwlCommentFrameBoard({
  label,
  src = FIRST_VISIT_RESIDENT_REGISTRATION_OWL_FRAME_SRC,
  placement,
  className = "",
  ariaLabel,
  onImageReady,
  onFigureClick,
  debugPin = null,
}: Props) {
  const { widthPx, heightPx } = FIRST_VISIT_RESIDENT_REGISTRATION_OWL_FRAME_DESIGN_SIZE;
  const { ref, scale } = useOwlCommentFrameScale();
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
      aria-label={ariaLabel ?? "フクロウ先生からの案内"}
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
        src={src}
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
          className="pointer-events-none absolute inset-0 overflow-hidden [text-shadow:0_1px_0_rgba(255,251,245,0.65)]"
          aria-hidden
        >
          <p className="m-0 leading-[inherit] text-[color:inherit]" style={firstVisitOwlFrameLabelStyle(placement, scale)}>
            {label}
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
