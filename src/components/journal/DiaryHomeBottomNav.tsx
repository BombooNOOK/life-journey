"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TAB_CLASS =
  "flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 font-medium";

/** ログイン後の主要画面用・下部ナビ（カレンダー / 日記一覧 / 本棚 / マイページ） */
export function DiaryHomeBottomNav() {
  const pathname = usePathname();

  const items = [
    {
      href: "/orders/calendar",
      label: "カレンダー",
      active: pathname === "/orders/calendar",
    },
    {
      href: "/orders/list",
      label: "日記一覧",
      active: pathname === "/orders/list",
    },
    {
      href: "/orders/bookshelf",
      label: "本棚",
      active: pathname.startsWith("/orders/bookshelf"),
    },
    {
      href: "/orders",
      label: "マイページ",
      active: pathname === "/orders",
    },
  ] as const;

  return (
    <nav
      className="lj-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-emerald-100/90 bg-[#fffdf9]/95 backdrop-blur-md"
      aria-label="日記メニュー"
    >
      <div className="mx-auto flex max-w-3xl pb-[max(0px,env(safe-area-inset-bottom))]">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${TAB_CLASS} ${
              item.active ? "text-emerald-900" : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <span
              className={`h-1 w-8 rounded-full ${item.active ? "bg-emerald-600/70" : "bg-transparent"}`}
              aria-hidden
            />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
