"use client";

import { useId, useState } from "react";

/**
 * 将来の顔アイコン変更の接続口。
 * 現状は準備中案内のみ（保存・DB・アップロードなし）。
 */
export function ForestResidentAvatarChangePanel() {
  const panelId = useId();
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-stone-200/80 bg-white px-3 py-3">
      <button
        type="button"
        className="inline-flex min-h-[44px] w-full items-center justify-between gap-2 text-left text-sm font-medium text-stone-800"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>顔アイコンを変える</span>
        <span className="text-xs font-normal text-stone-500" aria-hidden>
          {open ? "▼" : "›"}
        </span>
      </button>
      {open ? (
        <div id={panelId} className="mt-2 border-t border-stone-100 pt-2" role="status">
          <p className="text-sm leading-relaxed text-stone-600">
            ただいま準備中です。しばらくお待ちください。
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-stone-500">
            将来は、ここで住民票の顔アイコンを選べるようになります。
          </p>
        </div>
      ) : null}
    </div>
  );
}
