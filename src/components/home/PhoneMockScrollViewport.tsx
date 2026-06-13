"use client";

import { useEffect, useRef, type ReactNode } from "react";

const SCROLL_CLASS = [
  "absolute inset-0 overflow-y-scroll overscroll-contain touch-pan-y",
  "outline-none focus-visible:ring-2 focus-visible:ring-stone-300/80 focus-visible:ring-inset",
  "[-webkit-overflow-scrolling:touch]",
  "[scrollbar-width:thin]",
  "[scrollbar-color:rgb(168_162_158/0.85)_rgb(245_245_244/0.5)]",
  "[&::-webkit-scrollbar]:w-1.5",
  "[&::-webkit-scrollbar-thumb]:rounded-full",
  "[&::-webkit-scrollbar-thumb]:bg-stone-400/75",
  "[&::-webkit-scrollbar-track]:bg-stone-100/40",
].join(" ");

type Props = {
  children: ReactNode;
  label: string;
};

/**
 * トップのスマホ枠内スクロール。
 * Cursor / Electron 内蔵ブラウザではネストした overflow にホイールが届かないことがあるため、
 * wheel を手動で枠内 scrollTop に反映する。
 */
export function PhoneMockScrollViewport({ children, label }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      const canScrollUp = el.scrollTop > 0;
      const canScrollDown = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
      const scrollingUp = event.deltaY < 0;
      const scrollingDown = event.deltaY > 0;

      if ((scrollingUp && canScrollUp) || (scrollingDown && canScrollDown)) {
        event.preventDefault();
        event.stopPropagation();
        el.scrollTop += event.deltaY;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div
      ref={scrollRef}
      className={SCROLL_CLASS}
      tabIndex={0}
      role="region"
      aria-label={label}
      onPointerDown={() => scrollRef.current?.focus({ preventScroll: true })}
    >
      {children}
    </div>
  );
}
