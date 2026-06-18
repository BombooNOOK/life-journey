"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";

type Props = {
  href: string;
  label: string;
  icon: ReactNode;
  loadingLabel?: string;
};

const rowClass =
  "flex w-full min-h-[48px] items-center gap-3 px-3.5 py-2.5 text-left transition hover:bg-[#f7f3eb]/80 active:bg-[#f3ede3]/90 disabled:cursor-wait";

const iconWrapClass =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#efe6d8] text-[13px] font-medium text-[#7a6248] ring-1 ring-[#e3d6c4]/80";

const BUSY_CLASS = "pointer-events-none bg-[#f7f3eb]/50 opacity-90";

function pathnameFromHref(href: string): string {
  const beforeQuery = href.split("?")[0] ?? href;
  return beforeQuery !== "" ? beforeQuery : "/";
}

function defaultLoadingLabel(label: string): string {
  return `${label}を開いています…`;
}

/** マイページ管理メニュー行：押下直後にフクロウ表示してから遷移 */
export function MyPageManageMenuRow({ href, label, icon, loadingLabel }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const targetPathname = pathnameFromHref(href);
  const statusLabel = loadingLabel ?? defaultLoadingLabel(label);

  useEffect(() => {
    router.prefetch(href);
  }, [href, router]);

  useEffect(() => {
    if (!busy) return;
    if (pathname === targetPathname) {
      setBusy(false);
    }
  }, [busy, pathname, targetPathname]);

  useEffect(() => {
    if (!busy) return;
    const timeout = window.setTimeout(() => setBusy(false), 15_000);
    return () => window.clearTimeout(timeout);
  }, [busy]);

  function handleNavigate() {
    if (busy) return;
    setBusy(true);
    router.push(href);
  }

  return (
    <button
      type="button"
      disabled={busy}
      aria-busy={busy}
      onClick={handleNavigate}
      className={[rowClass, busy ? BUSY_CLASS : ""].filter(Boolean).join(" ")}
    >
      {busy ? (
        <span className="flex min-w-0 flex-1 items-center justify-center py-0.5">
          <OwlLoadingInline label={statusLabel} size="sm" className="text-sm text-[#5c4a36]" />
        </span>
      ) : (
        <>
          <span className={iconWrapClass} aria-hidden>
            {icon}
          </span>
          <span className="min-w-0 flex-1 text-sm font-medium text-[#5c4a36]">{label}</span>
          <span className="shrink-0 text-sm text-[#d4c4b0]" aria-hidden>
            →
          </span>
        </>
      )}
    </button>
  );
}
