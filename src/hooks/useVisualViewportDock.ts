"use client";

import { useEffect, useRef, useState } from "react";

export type VisualViewportDock = {
  offsetTop: number;
  offsetLeft: number;
  width: number;
  height: number;
  bottomInset: number;
};

const DEFAULT_DOCK: VisualViewportDock = {
  offsetTop: 0,
  offsetLeft: 0,
  width: 0,
  height: 0,
  bottomInset: 0,
};

function isChromeIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /CriOS/i.test(navigator.userAgent);
}

/**
 * Chrome iOS はキーボード表示中に visualViewport.height だけ縮み、
 * offsetTop が 0 のままになることがある。
 * bottom = innerHeight - offsetTop - height だと shell top が 0 に張り付くため、
 * Safari と同様にキーボード帯の上へ寄せる offsetTop を推定する。
 */
function inferChromeIOSOffsetTop(innerHeight: number, vvHeight: number): number | null {
  const keyboardBand = innerHeight - vvHeight;
  if (keyboardBand < 120) return null;

  // Safari 実測例: innerHeight 528, vv.height 194 → offsetTop 136, keyboardBand 334
  // bottom 帯の比率 ≈ 223/334 → offsetTop = keyboardBand * (1 - 0.62)
  const CHROME_IOS_KEYBOARD_BOTTOM_RATIO = 0.62;
  const bottomBand = Math.round(keyboardBand * CHROME_IOS_KEYBOARD_BOTTOM_RATIO);
  return Math.max(0, keyboardBand - bottomBand);
}

function readDock(): VisualViewportDock {
  const vv = window.visualViewport;
  if (!vv) {
    return {
      offsetTop: 0,
      offsetLeft: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      bottomInset: 0,
    };
  }

  const innerHeight = window.innerHeight;
  const vvHeight = Math.round(vv.height);
  let offsetTop = Math.round(vv.offsetTop);

  if (isChromeIOS() && offsetTop === 0 && vvHeight < innerHeight * 0.9) {
    const inferred = inferChromeIOSOffsetTop(innerHeight, vvHeight);
    if (inferred != null) {
      offsetTop = inferred;
    }
  }

  return {
    offsetTop,
    offsetLeft: Math.round(vv.offsetLeft),
    width: Math.round(vv.width),
    height: vvHeight,
    bottomInset: Math.round(Math.max(0, innerHeight - offsetTop - vvHeight)),
  };
}

function docksEqual(a: VisualViewportDock, b: VisualViewportDock): boolean {
  return (
    a.offsetTop === b.offsetTop &&
    a.offsetLeft === b.offsetLeft &&
    a.width === b.width &&
    a.height === b.height &&
    a.bottomInset === b.bottomInset
  );
}

/**
 * visualViewport の resize / scroll を追跡する。
 * offsetTop は scroll で変わることがあり、top 固定だとシェルが見えている領域からずれる。
 */
export function useVisualViewportDock(enabled: boolean): VisualViewportDock {
  const [dock, setDock] = useState<VisualViewportDock>(DEFAULT_DOCK);
  const dockRef = useRef<VisualViewportDock>(DEFAULT_DOCK);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      dockRef.current = DEFAULT_DOCK;
      setDock(DEFAULT_DOCK);
      return;
    }

    const commit = () => {
      rafRef.current = null;
      const next = readDock();
      if (docksEqual(next, dockRef.current)) return;
      dockRef.current = next;
      setDock(next);
    };

    const schedule = () => {
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(commit);
    };

    commit();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", schedule);
    vv?.addEventListener("scroll", schedule);
    window.addEventListener("resize", schedule);

    return () => {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      vv?.removeEventListener("resize", schedule);
      vv?.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [enabled]);

  return dock;
}
