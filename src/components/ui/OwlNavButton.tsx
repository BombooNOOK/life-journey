"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";

type Props = {
  href: string;
  loadingLabel: string;
  className?: string;
  children: ReactNode;
  prefetch?: boolean;
  /** 新しいタブで開く（鑑定書PDFプレビューなど） */
  openInNewTab?: boolean;
};

const BUSY_CLASS =
  "pointer-events-none scale-[0.98] opacity-80 transition-[transform,opacity] duration-75";
const IDLE_CLASS = "active:scale-[0.98] active:opacity-90 transition-[transform,opacity] duration-75";

/** 押下直後にフクロウ表示してから遷移（連打防止つき） */
export function OwlNavButton({
  href,
  loadingLabel,
  className = "",
  children,
  prefetch = true,
  openInNewTab = false,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (prefetch && !openInNewTab) {
      router.prefetch(href);
    }
  }, [href, openInNewTab, prefetch, router]);

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
      className={[className, busy ? BUSY_CLASS : IDLE_CLASS].filter(Boolean).join(" ")}
    >
      {busy ? <OwlLoadingInline label={loadingLabel} size="sm" /> : children}
    </button>
  );
}
