"use client";

import { useClientAuthNavState } from "@/hooks/useClientAuthNavState";

type Props = {
  className?: string;
  /** compact: ヘッダー向け1行 / banner: マイページ向けカード */
  variant?: "compact" | "banner";
};

/** ログイン中のメールアドレスを表示 */
export function LoggedInStatusBadge({ className = "", variant = "compact" }: Props) {
  const { isLoggedIn, viewerEmail } = useClientAuthNavState();

  if (!isLoggedIn) return null;

  if (variant === "banner") {
    return (
      <div
        className={`rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-4 py-3 ${className}`.trim()}
        role="status"
      >
        <p className="text-base font-semibold leading-snug text-emerald-950">ログイン中です</p>
        {viewerEmail ? (
          <p className="mt-1 break-all text-base leading-relaxed text-emerald-900">
            ログイン中：{viewerEmail}
          </p>
        ) : (
          <p className="mt-1 text-base leading-relaxed text-emerald-900">
            アカウントにログインしています。
          </p>
        )}
      </div>
    );
  }

  return (
    <span
      className={`max-w-[11rem] truncate text-sm leading-snug text-emerald-800 sm:max-w-[14rem] ${className}`.trim()}
      title={viewerEmail ?? undefined}
      role="status"
    >
      {viewerEmail ? `ログイン中：${viewerEmail}` : "ログイン中です"}
    </span>
  );
}
