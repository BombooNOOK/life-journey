"use client";

import { useLayoutEffect, useRef, useState, type RefObject } from "react";

import type { LogHouseRoomViewportBox } from "@/lib/loghouse/logHouseRoomStageLayout";

function readViewportSeed(): LogHouseRoomViewportBox {
  if (typeof window === "undefined") return { width: 0, height: 0 };
  return {
    width: Math.round(window.innerWidth),
    height: Math.round(window.innerHeight),
  };
}

/** fixed inset-0 コンテナの実寸（Cursor Simple Browser など 100dvh がズレる環境向け） */
export function useLogHouseRoomViewportBox(): {
  ref: RefObject<HTMLDivElement | null>;
  box: LogHouseRoomViewportBox;
} {
  const ref = useRef<HTMLDivElement | null>(null);
  // 0,0 だと初回に inset→実寸へ飛んで揺れるので window 寸法でシード
  const [box, setBox] = useState<LogHouseRoomViewportBox>(readViewportSeed);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      setBox((prev) => {
        // アドレスバー等の 1〜2px 揺れで再レイアウトしない
        if (Math.abs(prev.width - width) <= 2 && Math.abs(prev.height - height) <= 2) {
          return prev;
        }
        return { width, height };
      });
    };

    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return { ref, box };
}
