"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

import { selectViewerProfile } from "@/lib/profile/selectViewerProfile";

type Props = {
  profileId: string;
  href: string;
  className?: string;
  children: ReactNode;
  /** true のとき cookie 更新済み想定でそのまま遷移（マイページ上の現プロフィール向け） */
  directNav?: boolean;
};

/** 遷移前に /api/profiles/select で選択中プロフィールを切り替える */
export function ProfileSelectNavButton({
  profileId,
  href,
  className,
  children,
  directNav = false,
}: Props) {
  const [busy, setBusy] = useState(false);

  if (directNav) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await selectViewerProfile(profileId);
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      // router.push だと環境によって遷移しないことがあるため、確実に遷移する
      window.location.assign(href);
    } catch {
      window.alert("ページへ移動できませんでした。もう一度お試しください。");
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void handleClick()}
      className={className}
    >
      {busy ? "切り替え中…" : children}
    </button>
  );
}
