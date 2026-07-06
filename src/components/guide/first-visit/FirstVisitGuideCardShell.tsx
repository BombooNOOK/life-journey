import type { CSSProperties, ReactNode } from "react";

type Props = {
  children: ReactNode;
  topAccent?: string;
  borderColor?: string;
  backgroundColor?: string;
  /** true のときモバイルは枠なし・lg 以上だけカード枠 */
  bareOnMobile?: boolean;
};

const DEFAULT_STYLE = {
  topAccent: "#6b9080",
  borderColor: "rgba(16, 120, 80, 0.22)",
  backgroundColor: "#fffbf5",
};

/** 保存ギミックに近い1枚カード（上アクセントバー付き） */
export function FirstVisitGuideCardShell({
  children,
  topAccent = DEFAULT_STYLE.topAccent,
  borderColor = DEFAULT_STYLE.borderColor,
  backgroundColor = DEFAULT_STYLE.backgroundColor,
  bareOnMobile = false,
}: Props) {
  if (!bareOnMobile) {
    return (
      <div
        className="overflow-hidden rounded-2xl shadow-[0_14px_44px_-14px_rgba(24,83,53,0.24)] ring-1 ring-emerald-100/90"
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

  return (
    <div
      className="w-full lg:overflow-hidden lg:rounded-2xl lg:shadow-[0_14px_44px_-14px_rgba(24,83,53,0.24)] lg:ring-1 lg:ring-emerald-100/90"
      style={
        {
          "--first-visit-shell-border": borderColor,
          "--first-visit-shell-bg": backgroundColor,
        } as CSSProperties
      }
    >
      <div className="lg:overflow-hidden lg:rounded-2xl lg:border-[1.5px] lg:border-solid lg:bg-[var(--first-visit-shell-bg)] lg:[border-color:var(--first-visit-shell-border)]">
        <div className="hidden h-1.5 lg:block" style={{ backgroundColor: topAccent }} />
        <div className="lg:px-6 lg:pb-7 lg:pt-7">{children}</div>
      </div>
    </div>
  );
}
