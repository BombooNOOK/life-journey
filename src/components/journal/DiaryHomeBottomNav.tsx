"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  journalWriteHref: string;
  journalWriteLabel?: string;
  /** 期限切れなどで新規作成不可のとき、見た目だけ無効化 */
  journalWriteDisabled?: boolean;
};

/** 試作の日記ホーム専用・下部ナビ */
export function DiaryHomeBottomNav({
  journalWriteHref,
  journalWriteLabel,
  journalWriteDisabled = false,
}: Props) {
  const pathname = usePathname();
  const journalActive = pathname === "/journal" || pathname.startsWith("/journal/");

  const writeLabel = journalWriteLabel ?? "今日書く";
  const items = [
    { href: "/orders/calendar", label: "カレンダー", active: pathname === "/orders/calendar", isWriteTab: false },
    { href: journalWriteHref, label: writeLabel, active: journalActive, isWriteTab: true },
    {
      href: "/orders/bookshelf",
      label: "本棚",
      active: pathname.startsWith("/orders/bookshelf"),
      isWriteTab: false,
    },
    { href: "/guide", label: "使い方", active: pathname === "/guide", isWriteTab: false },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-100/90 bg-[#fffdf9]/95 backdrop-blur-md"
      aria-label="日記ホームメニュー"
    >
      <div className="mx-auto flex max-w-3xl">
        {items.map((item) => {
          const writeMuted = item.isWriteTab && journalWriteDisabled;
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-disabled={writeMuted ? true : undefined}
              className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium sm:text-xs ${
                item.active
                  ? "text-emerald-900"
                  : writeMuted
                    ? "text-stone-400"
                    : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <span
                className={`h-1 w-8 rounded-full ${item.active ? "bg-emerald-600/70" : "bg-transparent"}`}
                aria-hidden
              />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
