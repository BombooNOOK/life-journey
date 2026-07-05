"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";

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
}: Props) {
  const { widthPx, heightPx } = FIRST_VISIT_RESIDENT_REGISTRATION_OWL_FRAME_DESIGN_SIZE;
  const { ref, scale } = useOwlCommentFrameScale();

  return (
    <figure
      ref={ref}
      className={`relative mx-auto aspect-square w-full max-w-[min(100%,18rem)] sm:max-w-[20rem] ${className}`.trim()}
      aria-label={ariaLabel ?? "フクロウ先生からの案内"}
    >
      <Image
        src={src}
        alt=""
        aria-hidden
        width={widthPx}
        height={heightPx}
        sizes="(max-width: 640px) 72vw, 320px"
        className="h-full w-full select-none object-contain"
        priority
      />
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden [text-shadow:0_1px_0_rgba(255,251,245,0.65)]"
        aria-hidden
      >
        <p className="m-0 leading-[inherit] text-[color:inherit]" style={firstVisitOwlFrameLabelStyle(placement, scale)}>
          {label}
        </p>
      </div>
    </figure>
  );
}
