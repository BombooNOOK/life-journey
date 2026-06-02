"use client";

import { useCallback, useRef, type PointerEvent } from "react";

const TAP_MOVE_THRESHOLD_PX = 10;

/** pointerdown/up でタップとスクロールを区別する */
export function useTapWithoutScroll(onTap: () => void, disabled = false) {
  const startRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);

  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      if (disabled) return;
      startRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
    },
    [disabled],
  );

  const clearStart = useCallback((pointerId: number) => {
    if (startRef.current?.pointerId === pointerId) {
      startRef.current = null;
    }
  }, []);

  const onPointerUp = useCallback(
    (e: PointerEvent) => {
      const start = startRef.current;
      if (!start || start.pointerId !== e.pointerId || disabled) {
        clearStart(e.pointerId);
        return;
      }
      const dx = Math.abs(e.clientX - start.x);
      const dy = Math.abs(e.clientY - start.y);
      startRef.current = null;
      if (dx <= TAP_MOVE_THRESHOLD_PX && dy <= TAP_MOVE_THRESHOLD_PX) {
        e.preventDefault();
        e.stopPropagation();
        onTap();
      }
    },
    [clearStart, disabled, onTap],
  );

  const onPointerCancel = useCallback(
    (e: PointerEvent) => {
      clearStart(e.pointerId);
    },
    [clearStart],
  );

  return { onPointerDown, onPointerUp, onPointerCancel };
}
