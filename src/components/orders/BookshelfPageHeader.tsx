"use client";

import { InlineHelpButton } from "@/components/ui/InlineHelpButton";
import { OwlNavButton } from "@/components/ui/OwlNavButton";
import {
  LOG_HOUSE_BACK_TO_LINK_LABEL,
  LOG_HOUSE_LOADING_LABEL,
} from "@/lib/journal/logHouseLabels";

const BOOKSHELF_HELP_TEXT =
  "あなたの「あしあと」と「鑑定書」を、本のように並べて管理できます。鑑定書はブラウザで読める製本レイアウトのPDFにもなります。";

type Props = {
  activeProfileLabel: string;
  /** 本番デプロイ確認用（Vercel が注入する Git SHA の先頭7桁） */
  deployRevision?: string | null;
};

export function BookshelfPageHeader({ activeProfileLabel, deployRevision }: Props) {
  return (
    <div>
      <OwlNavButton
        href="/orders"
        loadingLabel={LOG_HOUSE_LOADING_LABEL}
        className="text-sm text-stone-600 hover:text-stone-900"
      >
        {LOG_HOUSE_BACK_TO_LINK_LABEL}
      </OwlNavButton>
      <h1 className="mt-2 text-2xl font-bold text-stone-900">本棚</h1>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-stone-700">
        <span>
          表示中: <span className="font-medium text-stone-900">「{activeProfileLabel}」</span>
        </span>
        <InlineHelpButton ariaLabel="本棚の説明" panelZIndexClass="z-50">
          {BOOKSHELF_HELP_TEXT}
        </InlineHelpButton>
        {deployRevision ? (
          <span className="text-[10px] text-stone-400" title="デプロイ確認用">
            反映 {deployRevision}
          </span>
        ) : null}
      </div>
    </div>
  );
}
