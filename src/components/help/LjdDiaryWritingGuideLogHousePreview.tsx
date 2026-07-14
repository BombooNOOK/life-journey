"use client";

import { MyPageActionCard } from "@/components/orders/MyPageActionCard";
import { LJD_DIARY_WRITING_GUIDE_LOGHOUSE_PREVIEW_LABEL } from "@/lib/help/ljdDiaryWritingGuideCopy";
import {
  LOG_HOUSE_DESK_WRITE_COMPANION_DESCRIPTION,
  LOG_HOUSE_DESK_WRITE_COMPANION_TITLE,
  LOG_HOUSE_DESK_WRITE_PAGE_TITLE,
  LOG_HOUSE_DESK_WRITE_SOLO_DESCRIPTION,
  LOG_HOUSE_DESK_WRITE_SOLO_TITLE,
} from "@/lib/loghouse/logHouseDeskWritingChoice";
import { myPageActionIllustrations } from "@/lib/mypage/myPageActionAssets";

type Props = {
  /** 伴走カードを強調表示（初回導線ページ向け） */
  emphasizeCompanion?: boolean;
};

/** 案内所用：机のあとの書き方選択イメージ（操作不可） */
export function LjdDiaryWritingGuideLogHousePreview({
  emphasizeCompanion = false,
}: Props) {
  return (
    <figure className="mx-auto max-w-md rounded-xl border border-stone-200/90 bg-[#faf8f4] p-3 sm:p-4">
      <figcaption className="mb-3 text-xs font-medium text-stone-500">
        {LJD_DIARY_WRITING_GUIDE_LOGHOUSE_PREVIEW_LABEL}
      </figcaption>
      <p className="mb-3 text-center text-sm font-semibold text-stone-800">
        {LOG_HOUSE_DESK_WRITE_PAGE_TITLE}
      </p>
      <div className="pointer-events-none flex flex-col gap-2.5" aria-hidden>
        <MyPageActionCard
          illustration={myPageActionIllustrations.writeDiary}
          title={LOG_HOUSE_DESK_WRITE_SOLO_TITLE}
          description={LOG_HOUSE_DESK_WRITE_SOLO_DESCRIPTION}
          tone="wood"
          className={emphasizeCompanion ? "opacity-55" : undefined}
        />
        <MyPageActionCard
          illustration={myPageActionIllustrations.writeCompanion}
          title={LOG_HOUSE_DESK_WRITE_COMPANION_TITLE}
          description={LOG_HOUSE_DESK_WRITE_COMPANION_DESCRIPTION}
          tone="emerald"
          emphasis={emphasizeCompanion}
          className={emphasizeCompanion ? "ring-2 ring-emerald-300/80" : undefined}
        />
      </div>
    </figure>
  );
}
