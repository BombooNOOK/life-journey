"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOMED_THRESHOLD = 1.02;

type Point = { x: number; y: number };

function touchDistance(a: Touch, b: Touch): number {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function touchMidpoint(a: Touch, b: Touch): Point {
  return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function clampTranslate(
  tx: number,
  ty: number,
  scale: number,
  containerW: number,
  containerH: number,
  contentW: number,
  contentH: number,
): Point {
  const scaledW = contentW * scale;
  const scaledH = contentH * scale;
  const maxX = Math.max(0, (scaledW - containerW) / 2);
  const maxY = Math.max(0, (scaledH - containerH) / 2);
  return {
    x: clamp(tx, -maxX, maxX),
    y: clamp(ty, -maxY, maxY),
  };
}

type Options = {
  enabled?: boolean;
  onZoomedChange?: (zoomed: boolean) => void;
};

export function usePinchZoomPan({ enabled = true, onZoomedChange }: Options = {}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const contentSizeRef = useRef({ width: 0, height: 0 });
  const scaleRef = useRef(MIN_SCALE);
  const translateRef = useRef<Point>({ x: 0, y: 0 });
  const pinchRef = useRef<{ distance: number; scale: number; midpoint: Point; translate: Point } | null>(
    null,
  );
  const panRef = useRef<{ start: Point; translate: Point } | null>(null);
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const gesturingRef = useRef(false);
  const onZoomedChangeRef = useRef(onZoomedChange);

  const [scale, setScale] = useState(MIN_SCALE);
  const [translate, setTranslate] = useState<Point>({ x: 0, y: 0 });
  const [isGesturing, setIsGesturing] = useState(false);

  useEffect(() => {
    onZoomedChangeRef.current = onZoomedChange;
  }, [onZoomedChange]);

  const notifyZoomed = useCallback((nextScale: number) => {
    onZoomedChangeRef.current?.(nextScale > ZOOMED_THRESHOLD);
  }, []);

  const applyTransform = useCallback((nextScale: number, nextTranslate: Point) => {
    scaleRef.current = nextScale;
    translateRef.current = nextTranslate;
    setScale(nextScale);
    setTranslate(nextTranslate);
    notifyZoomed(nextScale);
  }, [notifyZoomed]);

  const resetZoom = useCallback(() => {
    pinchRef.current = null;
    panRef.current = null;
    gesturingRef.current = false;
    applyTransform(MIN_SCALE, { x: 0, y: 0 });
    setIsGesturing(false);
  }, [applyTransform]);

  const setContentSize = useCallback((width: number, height: number) => {
    contentSizeRef.current = { width, height };
    if (scaleRef.current > ZOOMED_THRESHOLD) {
      const host = hostRef.current;
      if (!host) return;
      const rect = host.getBoundingClientRect();
      const clamped = clampTranslate(
        translateRef.current.x,
        translateRef.current.y,
        scaleRef.current,
        rect.width,
        rect.height,
        width,
        height,
      );
      applyTransform(scaleRef.current, clamped);
    }
  }, [applyTransform]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !enabled) return;

    const clampedForHost = (nextScale: number, nextTranslate: Point) => {
      const rect = host.getBoundingClientRect();
      const { width, height } = contentSizeRef.current;
      return clampTranslate(
        nextTranslate.x,
        nextTranslate.y,
        nextScale,
        rect.width,
        rect.height,
        width,
        height,
      );
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.stopPropagation();
        const [a, b] = [e.touches[0]!, e.touches[1]!];
        pinchRef.current = {
          distance: touchDistance(a, b),
          scale: scaleRef.current,
          midpoint: touchMidpoint(a, b),
          translate: { ...translateRef.current },
        };
        panRef.current = null;
        gesturingRef.current = true;
        setIsGesturing(true);
        return;
      }

      if (e.touches.length === 1 && scaleRef.current > ZOOMED_THRESHOLD) {
        e.stopPropagation();
        const t = e.touches[0]!;
        panRef.current = {
          start: { x: t.clientX, y: t.clientY },
          translate: { ...translateRef.current },
        };
        pinchRef.current = null;
        gesturingRef.current = true;
        setIsGesturing(true);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();
        const [a, b] = [e.touches[0]!, e.touches[1]!];
        const distance = touchDistance(a, b);
        const ratio = distance / pinchRef.current.distance;
        const nextScale = clamp(pinchRef.current.scale * ratio, MIN_SCALE, MAX_SCALE);
        const midpoint = touchMidpoint(a, b);
        const rect = host.getBoundingClientRect();
        const focalX = midpoint.x - rect.left - rect.width / 2;
        const focalY = midpoint.y - rect.top - rect.height / 2;
        const oldScale = scaleRef.current;
        const scaleRatio = oldScale > 0 ? nextScale / oldScale : 1;
        const rawTranslate = {
          x: focalX - (focalX - translateRef.current.x) * scaleRatio,
          y: focalY - (focalY - translateRef.current.y) * scaleRatio,
        };
        applyTransform(nextScale, clampedForHost(nextScale, rawTranslate));
        return;
      }

      if (e.touches.length === 1 && panRef.current && scaleRef.current > ZOOMED_THRESHOLD) {
        e.preventDefault();
        const t = e.touches[0]!;
        const dx = t.clientX - panRef.current.start.x;
        const dy = t.clientY - panRef.current.start.y;
        const rawTranslate = {
          x: panRef.current.translate.x + dx,
          y: panRef.current.translate.y + dy,
        };
        applyTransform(scaleRef.current, clampedForHost(scaleRef.current, rawTranslate));
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        pinchRef.current = null;
      }
      if (e.touches.length === 0) {
        panRef.current = null;
        gesturingRef.current = false;
        setIsGesturing(false);

        if (scaleRef.current <= ZOOMED_THRESHOLD) {
          applyTransform(MIN_SCALE, { x: 0, y: 0 });
        }

        const t = e.changedTouches[0];
        if (!t) return;
        const now = Date.now();
        const last = lastTapRef.current;
        if (
          last &&
          now - last.time < 320 &&
          Math.hypot(t.clientX - last.x, t.clientY - last.y) < 24
        ) {
          resetZoom();
          lastTapRef.current = null;
          return;
        }
        lastTapRef.current = { time: now, x: t.clientX, y: t.clientY };
      }
    };

    host.addEventListener("touchstart", onTouchStart, { passive: true });
    host.addEventListener("touchmove", onTouchMove, { passive: false });
    host.addEventListener("touchend", onTouchEnd, { passive: true });
    host.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      host.removeEventListener("touchstart", onTouchStart);
      host.removeEventListener("touchmove", onTouchMove);
      host.removeEventListener("touchend", onTouchEnd);
      host.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [applyTransform, enabled, resetZoom]);

  return {
    hostRef,
    scale,
    translate,
    isGesturing,
    isZoomed: scale > ZOOMED_THRESHOLD,
    gesturingRef,
    resetZoom,
    setContentSize,
  };
}
