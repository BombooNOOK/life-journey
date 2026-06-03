"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { selectViewerProfile } from "@/lib/profile/selectViewerProfile";

type Props = {
  profileId: string;
  href: string;
  className?: string;
  children: ReactNode;
  /** true のとき cookie 更新済み想定でそのまま遷移（マイページ上の現プロフィール向け） */
  directNav?: boolean;
  /** 遷移中に表示する文言 */
  loadingLabel?: string;
};

function NavSpinner() {
  return (
    <span
      className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden
    />
  );
}

/** 遷移前に /api/profiles/select で選択中プロフィールを切り替える（必要時） */
export function ProfileSelectNavButton({
  profileId,
  href,
  className = "",
  children,
  directNav = false,
  loadingLabel = "開いています…",
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (directNav) {
      router.prefetch(href);
    }
  }, [directNav, href, router]);

  async function handleNavigate() {
    if (busy) return;
    setBusy(true);
    try {
      if (!directNav) {
        const result = await selectViewerProfile(profileId);
        if (!result.ok) {
          window.alert(result.error);
          setBusy(false);
          return;
        }
      }
      router.push(href);
    } catch {
      window.alert("ページへ移動できませんでした。もう一度お試しください。");
      setBusy(false);
    }
  }

  const stateClass = busy
    ? "pointer-events-none scale-[0.98] opacity-80"
    : "active:scale-[0.98] active:opacity-90";

  return (
    <button
      type="button"
      disabled={busy}
      aria-busy={busy}
      onClick={() => void handleNavigate()}
      className={`${className} ${stateClass} transition-[transform,opacity] duration-75`}
    >
      {busy ? (
        <span className="inline-flex items-center justify-center gap-2">
          <NavSpinner />
          <span>{loadingLabel}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
