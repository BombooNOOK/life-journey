import type { ReactNode } from "react";

import { guardianColorStyleForName } from "@/lib/journal/guardianColorDisplay";

type Props = {
  children: ReactNode;
  /** 未指定時は伴走ガイド既定のクリーム×グリーン */
  topAccent?: string;
  borderColor?: string;
  backgroundColor?: string;
};

const DEFAULT_STYLE = {
  topAccent: "#6b9080",
  borderColor: "rgba(16, 120, 80, 0.22)",
  backgroundColor: "#fffbf5",
};

/** 保存ギミックに近い1枚カード（上アクセントバー付き） */
export function CompanionWritingGuideCardShell({
  children,
  topAccent = DEFAULT_STYLE.topAccent,
  borderColor = DEFAULT_STYLE.borderColor,
  backgroundColor = DEFAULT_STYLE.backgroundColor,
}: Props) {
  return (
    <div
      className="overflow-hidden rounded-2xl shadow-[0_10px_32px_-12px_rgba(90,70,45,0.18)] ring-1 ring-[#e8dcc8]/80"
      style={{
        borderWidth: 1.5,
        borderStyle: "solid",
        borderColor,
        backgroundColor,
      }}
    >
      <div className="h-1.5" style={{ backgroundColor: topAccent }} />
      <div className="px-5 pb-6 pt-6 sm:px-6 sm:pb-7 sm:pt-7">{children}</div>
    </div>
  );
}

export function companionWritingGuideCardStyleFromGuardian(guardianColorName: string | null) {
  const style = guardianColorStyleForName(guardianColorName);
  return {
    topAccent: style.topAccent,
    borderColor: style.borderColor,
    backgroundColor: style.backgroundColor,
  };
}
