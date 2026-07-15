"use client";

import Link from "next/link";

import { LJD_PAPER_SECONDARY_BTN_CLASS } from "@/lib/ljd/ljdPaperSurface";

export type ForestBookshelfListItem = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
};

type Props = {
  title: string;
  emptyMessage: string;
  items: ForestBookshelfListItem[];
  onClose: () => void;
};

/** 背表紙タップ後の一覧パネル */
export function ForestBookshelfListPanel({ title, emptyMessage, items, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-stone-900/35 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-16 sm:items-center sm:pb-8">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="一覧を閉じる"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="forest-bookshelf-list-title"
        className="relative z-[1] flex max-h-[min(70dvh,32rem)] w-full max-w-md flex-col overflow-hidden rounded-[1.25rem] border border-[#e4d5c0]/95 bg-[#fdf8f0] shadow-[0_16px_40px_rgba(60,40,20,0.28)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#ebe2d4] px-4 py-3">
          <h2
            id="forest-bookshelf-list-title"
            className="text-base font-semibold text-[#3f3428]"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full px-0 text-[#6a5846] ${LJD_PAPER_SECONDARY_BTN_CLASS}`}
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-[#8a7b6a]">{emptyMessage}</p>
          ) : (
            <ul className="divide-y divide-[#ebe2d4]">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="flex min-h-[56px] flex-col justify-center px-3 py-3 transition hover:bg-[#f3ead8]/70 active:bg-[#f3ead8]"
                    onClick={onClose}
                  >
                    <span className="text-sm font-medium text-[#3f3428]">{item.title}</span>
                    {item.subtitle ? (
                      <span className="mt-0.5 text-xs text-[#8a7b6a]">{item.subtitle}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
