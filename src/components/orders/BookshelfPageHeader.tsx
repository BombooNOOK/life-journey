"use client";

import Link from "next/link";

import { InlineHelpButton } from "@/components/ui/InlineHelpButton";

const BOOKSHELF_HELP_TEXT =
  "あなたの「日記」と「鑑定書」を、本のように並べて管理できます。鑑定書はブラウザで読める製本レイアウトのPDFにもなります。";

type Props = {
  activeProfileLabel: string;
};

export function BookshelfPageHeader({ activeProfileLabel }: Props) {
  return (
    <div>
      <Link href="/orders" className="text-sm text-stone-600 hover:text-stone-900">
        ← マイページへ
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-stone-900">本棚</h1>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-stone-700">
        <span>
          表示中: <span className="font-medium text-stone-900">「{activeProfileLabel}」</span>
        </span>
        <InlineHelpButton ariaLabel="本棚の説明" panelZIndexClass="z-50">
          {BOOKSHELF_HELP_TEXT}
        </InlineHelpButton>
      </div>
    </div>
  );
}
