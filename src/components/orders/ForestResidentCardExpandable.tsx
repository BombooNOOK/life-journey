"use client";

import { useCallback, useEffect, useState } from "react";

import { ForestResidentCard } from "@/components/guide/ForestResidentCard";
import type { ForestResidentCardData } from "@/lib/forestResident/forestResidentNumber";

type Props = {
  card: ForestResidentCardData;
};

/** タップで拡大、再タップで戻る */
export function ForestResidentCardExpandable({ card }: Props) {
  const [expanded, setExpanded] = useState(false);

  const close = useCallback(() => setExpanded(false), []);
  const toggle = useCallback(() => setExpanded((value) => !value), []);

  useEffect(() => {
    if (!expanded) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [close, expanded]);

  return (
    <>
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={expanded}
          aria-label={expanded ? "住民票を閉じる" : "住民票を拡大表示"}
          className="w-full max-w-[16rem] rounded-xl transition active:scale-[0.99]"
        >
          <ForestResidentCard {...card} />
        </button>
        <p className="mt-2 text-center text-xs text-stone-500">タップで拡大</p>
      </div>

      {expanded ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-label="森の住民票（拡大）"
          onClick={close}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              close();
            }}
            aria-label="拡大表示を閉じる"
            className="w-full max-w-[min(90vw,28rem)] rounded-xl shadow-2xl ring-1 ring-white/20"
          >
            <ForestResidentCard {...card} />
          </button>
          <p className="pointer-events-none absolute bottom-[max(1rem,env(safe-area-inset-bottom))] text-xs text-white/80">
            タップで戻る
          </p>
        </div>
      ) : null}
    </>
  );
}
