"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";
import { selectViewerProfile } from "@/lib/profile/selectViewerProfile";

type Props = {
  profileId: string;
  href: string;
  className?: string;
  children: ReactNode;
  /** true のとき cookie 更新済み想定でそのまま遷移（マイページ上の選択済み記録枠向け） */
  directNav?: boolean;
  /** 遷移中に表示する文言 */
  loadingLabel?: string;
};

/** 遷移前に /api/profiles/select で選択中記録枠を切り替える（必要時） */
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
      {busy ? <OwlLoadingInline label={loadingLabel} size="sm" /> : children}
    </button>
  );
}
