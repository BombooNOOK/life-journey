"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  journalWriteHref: string;
  journalWriteLabel?: string;
};

/** 試作の日記ホーム専用・下部ナビ */
export function DiaryHomeBottomNav({ journalWriteHref, journalWriteLabel }: Props) {
  const pathname = usePathname();
  const journalActive = pathname === "/journal" || pathname.startsWith("/journal/");

  const items = [
    { href: "/orders/calendar", label: "カレンダー", active: pathname === "/orders/calendar" },
    { href: journalWriteHref, label: journalWriteLabel ?? "今日書く", active: journalActive },
    {
      href: "/orders/bookshelf",
      label: "本棚",
      active: pathname.startsWith("/orders/bookshelf"),
    },
    { href: "/guide", label: "使い方", active: pathname === "/guide" },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-100/90 bg-[#fffdf9]/95 backdrop-blur-md"
      aria-label="日記ホームメニュー"
    >
      <div className="mx-auto flex max-w-3xl">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium sm:text-xs ${
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
