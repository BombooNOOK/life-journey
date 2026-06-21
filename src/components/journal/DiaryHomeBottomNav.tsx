"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { OwlNavButton } from "@/components/ui/OwlNavButton";

const TAB_CLASS =
  "flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 font-medium";

const NAV_ITEMS = [
  {
    href: "/orders/calendar",
    label: "カレンダー",
    loadingLabel: "カレンダーを開いています…",
    isActive: (pathname: string) => pathname === "/orders/calendar",
  },
  {
    href: "/orders/list",
    label: "日記一覧",
    loadingLabel: "日記一覧を開いています…",
    isActive: (pathname: string) => pathname === "/orders/list",
  },
  {
    href: "/orders/bookshelf",
    label: "本棚",
    loadingLabel: "本棚を開いています…",
    isActive: (pathname: string) => pathname.startsWith("/orders/bookshelf"),
  },
  {
    href: "/orders",
    label: "マイページ",
    loadingLabel: "マイページを開いています…",
    isActive: (pathname: string) => pathname === "/orders",
  },
] as const;

/** ログイン後の主要画面用・下部ナビ（カレンダー / 日記一覧 / 本棚 / マイページ） */
export function DiaryHomeBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    for (const item of NAV_ITEMS) {
      router.prefetch(item.href);
    }
  }, [router]);

  return (
    <nav
      className="lj-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-emerald-100/90 bg-[#fffdf9]/95 backdrop-blur-md"
      aria-label="日記メニュー"
    >
      <div className="mx-auto flex max-w-3xl pb-[max(0px,env(safe-area-inset-bottom))]">
        {NAV_ITEMS.map((item) => {
          const active = item.isActive(pathname);
          const tabContent = (
            <>
              <span
                className={`h-1 w-8 rounded-full ${active ? "bg-emerald-600/70" : "bg-transparent"}`}
                aria-hidden
              />
              {item.label}
            </>
          );

          if (active) {
            return (
              <span
                key={item.href}
                className={`${TAB_CLASS} text-emerald-900`}
                aria-current="page"
              >
                {tabContent}
              </span>
            );
          }

          return (
            <OwlNavButton
              key={item.href}
              href={item.href}
              loadingLabel={item.loadingLabel}
              compactLoading
              matchPathname={item.isActive}
              className={`${TAB_CLASS} text-stone-500 hover:text-stone-800`}
            >
              {tabContent}
            </OwlNavButton>
          );
        })}
      </div>
    </nav>
  );
}
