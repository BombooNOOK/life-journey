"use client";

import Link from "next/link";

import { MyPageActionCard } from "@/components/orders/MyPageActionCard";
import { MyPageSubpageHeader } from "@/components/orders/MyPageSubpageHeader";
import { myPageActionIllustrations } from "@/lib/mypage/myPageActionAssets";
import {
  LOG_HOUSE_DESK_WRITE_COMPANION_DESCRIPTION,
  LOG_HOUSE_DESK_WRITE_COMPANION_TITLE,
  LOG_HOUSE_DESK_WRITE_PAGE_DESCRIPTION,
  LOG_HOUSE_DESK_WRITE_PAGE_TITLE,
  LOG_HOUSE_DESK_WRITE_SOLO_DESCRIPTION,
  LOG_HOUSE_DESK_WRITE_SOLO_HREF,
  LOG_HOUSE_DESK_WRITE_SOLO_TITLE,
} from "@/lib/loghouse/logHouseDeskWritingChoice";
import { LOG_HOUSE_BACK_TO_LABEL } from "@/lib/journal/logHouseLabels";

type Props = {
  companionWritingHref: string;
};

/** 机からの書き方選択（ソロ / 鑑定士と） */
export function LogHouseDeskWritingChoice({ companionWritingHref }: Props) {
  return (
    <div className="mx-auto w-full max-w-md space-y-5 px-1 pb-8 sm:space-y-6">
      <MyPageSubpageHeader
        title={LOG_HOUSE_DESK_WRITE_PAGE_TITLE}
        description={LOG_HOUSE_DESK_WRITE_PAGE_DESCRIPTION}
        backHref="/orders"
        backLabel={LOG_HOUSE_BACK_TO_LABEL}
      />

      <div className="flex flex-col gap-3">
        <Link
          href={LOG_HOUSE_DESK_WRITE_SOLO_HREF}
          className="block w-full rounded-2xl text-left transition-[transform,opacity] duration-75 active:scale-[0.99]"
        >
          <MyPageActionCard
            illustration={myPageActionIllustrations.writeDiary}
            title={LOG_HOUSE_DESK_WRITE_SOLO_TITLE}
            description={LOG_HOUSE_DESK_WRITE_SOLO_DESCRIPTION}
            tone="wood"
          />
        </Link>

        <Link
          href={companionWritingHref}
          className="block w-full rounded-2xl text-left transition-[transform,opacity] duration-75 active:scale-[0.99]"
        >
          <MyPageActionCard
            illustration={myPageActionIllustrations.writeCompanion}
            title={LOG_HOUSE_DESK_WRITE_COMPANION_TITLE}
            description={LOG_HOUSE_DESK_WRITE_COMPANION_DESCRIPTION}
            tone="emerald"
          />
        </Link>
      </div>
    </div>
  );
}
