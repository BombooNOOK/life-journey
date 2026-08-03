"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const DELETE_WIDTH_PX = 88;
const OPEN_THRESHOLD_PX = 44;
const DIRECTION_LOCK_PX = 8;

type Props = {
  href: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  deleting?: boolean;
  children: React.ReactNode;
};

/**
 * あしあと一覧行：左スワイプで削除を表示。
 * 縦スクロールと競合しないよう、水平が優勢なときだけ追従する。
 */
export function JournalListSwipeRow({
  href,
  open,
  onOpenChange,
  onDelete,
  deleting = false,
  children,
}: Props) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startOffsetRef = useRef(0);
  const axisRef = useRef<"undecided" | "x" | "y">("undecided");
  const movedRef = useRef(false);
  const offsetRef = useRef(0);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    if (dragging) return;
    setOffset(open ? -DELETE_WIDTH_PX : 0);
  }, [dragging, open]);

  const clampOffset = useCallback((value: number) => {
    return Math.max(-DELETE_WIDTH_PX, Math.min(0, value));
  }, []);

  const endDrag = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    const nextOpen = offsetRef.current <= -OPEN_THRESHOLD_PX;
    setOffset(nextOpen ? -DELETE_WIDTH_PX : 0);
    onOpenChange(nextOpen);
    axisRef.current = "undecided";
  }, [dragging, onOpenChange]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (deleting) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      movedRef.current = false;
      axisRef.current = "undecided";
      startXRef.current = event.clientX;
      startYRef.current = event.clientY;
      startOffsetRef.current = open ? -DELETE_WIDTH_PX : offsetRef.current;
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [deleting, open],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging) return;
      const dx = event.clientX - startXRef.current;
      const dy = event.clientY - startYRef.current;

      if (axisRef.current === "undecided") {
        if (Math.abs(dx) < DIRECTION_LOCK_PX && Math.abs(dy) < DIRECTION_LOCK_PX) return;
        if (Math.abs(dy) > Math.abs(dx) * 1.15) {
          axisRef.current = "y";
          setDragging(false);
          setOffset(open ? -DELETE_WIDTH_PX : 0);
          try {
            event.currentTarget.releasePointerCapture(event.pointerId);
          } catch {
            // ignore
          }
          return;
        }
        axisRef.current = "x";
      }

      if (axisRef.current !== "x") return;
      event.preventDefault();
      if (Math.abs(dx) > 6) movedRef.current = true;
      setOffset(clampOffset(startOffsetRef.current + dx));
    },
    [clampOffset, dragging, open],
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging) return;
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }
      endDrag();
    },
    [dragging, endDrag],
  );

  const onPointerCancel = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging) return;
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }
      endDrag();
    },
    [dragging, endDrag],
  );

  return (
    <div className="relative overflow-hidden bg-[#c45c48]">
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        disabled={deleting}
        aria-hidden={!open}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onDelete();
        }}
        className="absolute inset-y-0 right-0 flex w-[88px] items-center justify-center bg-[#c45c48] text-sm font-semibold text-white disabled:opacity-70"
      >
        {deleting ? "削除中…" : "削除"}
      </button>

      <div
        className="relative touch-pan-y bg-[#fffaf2]"
        style={{
          transform: `translate3d(${offset}px, 0, 0)`,
          transition: dragging ? "none" : "transform 180ms ease-out",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <Link
          href={href}
          draggable={false}
          onClick={(event) => {
            if (movedRef.current || open || Math.abs(offsetRef.current) > 8) {
              event.preventDefault();
              if (open) onOpenChange(false);
            }
          }}
          className="flex min-h-[56px] items-center gap-3 px-3 py-3.5 transition active:bg-[#f3ead8]/60"
        >
          {children}
        </Link>
      </div>
    </div>
  );
}
