"use client";

import { useLayoutEffect, useRef, useState, type RefObject } from "react";

import type { LogHouseRoomViewportBox } from "@/lib/loghouse/logHouseRoomStageLayout";

/** fixed inset-0 コンテナの実寸（Cursor Simple Browser など 100dvh がズレる環境向け） */
export function useLogHouseRoomViewportBox(): {
  ref: RefObject<HTMLDivElement | null>;
  box: LogHouseRoomViewportBox;
  /** 初回実測済み（これより前はステージを出さない） */
  measured: boolean;
} {
  const ref = useRef<HTMLDivElement | null>(null);
  // window シードは実コンテナとズレやすく、左寄りのポストが左端→定位置に動いて見える
  const [box, setBox] = useState<LogHouseRoomViewportBox>({ width: 0, height: 0 });
  const [measured, setMeasured] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      if (width <= 0 || height <= 0) return;
      setMeasured(true);
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

  return { ref, box, measured };
}
