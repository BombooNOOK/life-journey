"use client";

import Link from "next/link";

import { PhoneMockScrollViewport } from "@/components/home/PhoneMockScrollViewport";
import { DiaryHomeBottomNav } from "@/components/journal/DiaryHomeBottomNav";
import { LogHouseDeskWritingChoice } from "@/components/orders/LogHouseDeskWritingChoice";
import { journalWithCompanionPath } from "@/lib/journal/journalNav";

const PHONE_OUTER =
  "overflow-hidden rounded-[1.75rem] border border-stone-300/60 bg-gradient-to-b from-[#f3ead8] to-[#ebe2d0] p-1.5 shadow-[0_10px_32px_rgba(90,70,45,0.14)]";

const PHONE_SCREEN =
  "relative mx-auto h-[min(78dvh,44rem)] w-full overflow-hidden rounded-[1.35rem] bg-[#faf8f5]";

const PREVIEW_PROFILES = [
  { id: "preview-mog", nickname: "モグ" },
  { id: "preview-sample", nickname: "サンプル" },
] as const;

/** PCでもスマホ縦の見た目で、机の書き方選択＋下部ナビを確認するプレビュー */
export function DeskWritePreviewClient() {
  const companionHref = journalWithCompanionPath(
    "/preview/desk-write",
    PREVIEW_PROFILES[0].id,
    "2026-07-14",
  );

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col gap-3 px-3 py-5">
      <div className="rounded-xl border border-amber-200 bg-amber-50/95 px-3 py-2 text-[11px] leading-relaxed text-amber-950 shadow-sm">
        <p>
          <strong>プレビュー</strong>（スマホ枠）。日記まわりの半没入トーンと下部ナビ4アイコンを確認できます。ログイン不要。
        </p>
        <p className="mt-1 flex flex-wrap gap-x-2 gap-y-1">
          <Link href="/preview" className="font-medium underline-offset-2 hover:underline">
            一覧
          </Link>
          <Link
            href="/preview/loghouse-room"
            className="font-medium underline-offset-2 hover:underline"
          >
            ログハウス枠
          </Link>
          <Link href="/orders/write" className="font-medium underline-offset-2 hover:underline">
            本番相当 /orders/write
          </Link>
        </p>
      </div>

      <div className={`${PHONE_OUTER} w-full max-w-[24rem] self-center`}>
        <div className={PHONE_SCREEN}>
          <div className="absolute inset-0 pb-[4.5rem]">
            <PhoneMockScrollViewport label="今日はどうしますか？のプレビュー">
              <div className="px-3 pt-4">
                <LogHouseDeskWritingChoice
                  companionWritingHref={companionHref}
                  profiles={[...PREVIEW_PROFILES]}
                  activeProfileId={PREVIEW_PROFILES[0].id}
                />
              </div>
            </PhoneMockScrollViewport>
          </div>
          {/* 枠内に固定した下部ナビ（本番と同じコンポーネント） */}
          <div className="pointer-events-auto absolute inset-x-0 bottom-0 [&_nav]:!relative [&_nav]:inset-auto [&_nav]:z-10">
            <DiaryHomeBottomNav forceActivePath="/orders/list" />
          </div>
        </div>
      </div>
    </div>
  );
}
