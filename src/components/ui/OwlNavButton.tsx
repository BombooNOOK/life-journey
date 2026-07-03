"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";
import { OwlSpinIndicator } from "@/components/ui/OwlSpinIndicator";

type Props = {
  href: string;
  loadingLabel: string;
  className?: string;
  children: ReactNode;
  prefetch?: boolean;
  /** 新しいタブで開く（鑑定書PDFプレビューなど） */
  openInNewTab?: boolean;
  /** 下部タブなど狭い領域：くるくるフクロウのみ（文言は sr-only） */
  compactLoading?: boolean;
  /** 遷移完了判定（未指定時は href のパスと完全一致） */
  matchPathname?: (pathname: string) => boolean;
  style?: CSSProperties;
};

const BUSY_CLASS =
  "pointer-events-none scale-[0.98] opacity-80 transition-[transform,opacity] duration-75";
const IDLE_CLASS = "active:scale-[0.98] active:opacity-90 transition-[transform,opacity] duration-75";

function pathnameFromHref(href: string): string {
  const beforeQuery = href.split("?")[0] ?? href;
  return beforeQuery !== "" ? beforeQuery : "/";
}

/** 押下直後にフクロウ表示してから遷移（連打防止つき） */
export function OwlNavButton({
  href,
  loadingLabel,
  className = "",
  children,
  prefetch = true,
  openInNewTab = false,
  compactLoading = false,
  matchPathname,
  style,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const targetPathname = pathnameFromHref(href);

  useEffect(() => {
    if (prefetch && !openInNewTab) {
      router.prefetch(href);
    }
  }, [href, openInNewTab, prefetch, router]);

  useEffect(() => {
    if (!busy || openInNewTab) return;
    const arrived = matchPathname ? matchPathname(pathname) : pathname === targetPathname;
    if (arrived) {
      setBusy(false);
    }
  }, [busy, matchPathname, openInNewTab, pathname, targetPathname]);

  useEffect(() => {
    if (!busy || openInNewTab) return;
    const timeout = window.setTimeout(() => setBusy(false), 15_000);
    return () => window.clearTimeout(timeout);
  }, [busy, openInNewTab]);

  function handleNavigate() {
    if (busy) return;
    setBusy(true);
    if (openInNewTab) {
      window.open(href, "_blank", "noopener,noreferrer");
      window.setTimeout(() => setBusy(false), 1200);
      return;
    }
    router.push(href);
  }

  return (
    <button
      type="button"
      disabled={busy}
      aria-busy={busy}
      onClick={handleNavigate}
      style={style}
      className={[className, busy ? BUSY_CLASS : IDLE_CLASS].filter(Boolean).join(" ")}
    >
      {busy ? (
        compactLoading ? (
          <span className="inline-flex flex-col items-center justify-center gap-0.5" role="status">
            <OwlSpinIndicator size="sm" />
            <span className="sr-only">{loadingLabel}</span>
          </span>
        ) : (
          <OwlLoadingInline label={loadingLabel} size="sm" />
        )
      ) : (
        children
      )}
    </button>
  );
}
