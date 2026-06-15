"use client";

import { useClientAuthNavState } from "@/hooks/useClientAuthNavState";

function truncateEmail(email: string, maxLen = 18): string {
  if (email.length <= maxLen) return email;
  const at = email.indexOf("@");
  if (at > 0 && at < maxLen - 2) {
    return `${email.slice(0, at)}…${email.slice(at)}`;
  }
  return `${email.slice(0, maxLen - 1)}…`;
}

type Props = {
  className?: string;
};

/** ヘッダー専用：ログイン中メール（1か所のみ） */
export function LoggedInStatusBadge({ className = "" }: Props) {
  const { isLoggedIn, viewerEmail } = useClientAuthNavState();

  if (!isLoggedIn) return null;

  const label = viewerEmail
    ? `ログイン中：${truncateEmail(viewerEmail)}`
    : "ログイン中";

  return (
    <span
      className={`max-w-full truncate text-sm leading-snug text-emerald-800 sm:max-w-[20rem] sm:text-base ${className}`.trim()}
      title={viewerEmail ?? undefined}
      role="status"
    >
      {label}
    </span>
  );
}
