"use client";

import { useEffect, useState } from "react";

import { consumeCompanionWritingFarewell } from "@/lib/journal/companionWriting/session";
import { COMPANION_WRITING_FAREWELL_MESSAGE } from "@/lib/journal/companionWriting/types";

/** トップページ：「今日はここまで」後の一区切りメッセージ */
export function CompanionWritingFarewellBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (consumeCompanionWritingFarewell()) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      className="relative z-30 mx-auto mb-4 max-w-lg rounded-xl border border-emerald-100 bg-emerald-50/90 px-4 py-3 text-sm leading-relaxed text-emerald-950 shadow-sm"
      role="status"
    >
      {COMPANION_WRITING_FAREWELL_MESSAGE}
    </div>
  );
}
