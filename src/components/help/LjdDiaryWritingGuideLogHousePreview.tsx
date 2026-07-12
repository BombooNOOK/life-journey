"use client";

import { CompanionWritingButtonLabel } from "@/components/journal/companion-writing/CompanionWritingButtonLabel";
import { MyPageActionCard } from "@/components/orders/MyPageActionCard";
import { LJD_DIARY_WRITING_GUIDE_LOGHOUSE_PREVIEW_LABEL } from "@/lib/help/ljdDiaryWritingGuideCopy";
import { myPageActionIllustrations } from "@/lib/mypage/myPageActionAssets";

type Props = {
  /** 伴走カードを強調表示（初回導線ページ向け・骨格用） */
  emphasizeCompanion?: boolean;
};

/** 案内所用：ログハウス②の見た目プレビュー（操作不可） */
export function LjdDiaryWritingGuideLogHousePreview({
  emphasizeCompanion = true,
}: Props) {
  return (
    <figure className="mx-auto max-w-md rounded-xl border border-stone-200/90 bg-[#faf8f4] p-3 sm:p-4">
      <figcaption className="mb-3 text-xs font-medium text-stone-500">
        {LJD_DIARY_WRITING_GUIDE_LOGHOUSE_PREVIEW_LABEL}
      </figcaption>
      <div className="pointer-events-none flex flex-col gap-2.5" aria-hidden>
        <MyPageActionCard
          illustration={myPageActionIllustrations.writeCompanion}
          title={<CompanionWritingButtonLabel />}
          description="今日の気分から、短く書き始めます"
          tone="emerald"
          emphasis={emphasizeCompanion}
          className={emphasizeCompanion ? "ring-2 ring-emerald-300/80" : ""}
        />
        <MyPageActionCard
          illustration={myPageActionIllustrations.writeDiary}
          title="日記を書く"
          description="今日の出来事や気持ちを記録します"
          tone="emerald"
          className="opacity-55"
        />
      </div>
    </figure>
  );
}
