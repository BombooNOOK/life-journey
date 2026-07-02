"use client";

import Link from "next/link";

import { MyPageActionCard } from "@/components/orders/MyPageActionCard";
import { CompanionWritingButtonLabel } from "@/components/journal/companion-writing/CompanionWritingButtonLabel";
import { FieldLabelWithHelp } from "@/components/ui/InlineHelpButton";
import { ProfileSelectNavButton } from "@/components/profile/ProfileSelectNavButton";
import { myPageActionIllustrations } from "@/lib/mypage/myPageActionAssets";
import { COMPANION_WRITING_FORMAL_TITLE } from "@/lib/journal/companionWriting/types";
import type { SerializedUserEntitlement } from "@/lib/entitlement/resolveUserEntitlement";
import type { FirstVisitGuideState } from "@/lib/onboarding/firstVisitGuideState";

type Props = {
  profileId: string;
  isActive: boolean;
  entitlement: SerializedUserEntitlement;
  kanteiOrderId: string | null;
  firstVisitGuideState: FirstVisitGuideState;
  companionWritingHref: string;
};

const navButtonClass =
  "block w-full rounded-2xl text-left transition-[transform,opacity] duration-75 active:scale-[0.99]";

/** マイページトップ：選択中プロフィールで何をするか */
export function MyPageMainActions({
  profileId,
  isActive,
  entitlement,
  kanteiOrderId,
  firstVisitGuideState,
  companionWritingHref,
}: Props) {
  const canWriteJournal =
    entitlement.canUseContinuedFeatures || entitlement.canCreateFirstJournal;
  const journalEmphasis = entitlement.tier === "trial_not_started";
  const journalBlocked = entitlement.tier === "trial_expired" || !canWriteJournal;
  const showCompanionWriting =
    canWriteJournal && kanteiOrderId != null && firstVisitGuideState !== "needs_kantei";
  const companionEmphasis = firstVisitGuideState === "ready_first_journal";

  return (
    <section id="main-actions" className="space-y-3">
      <FieldLabelWithHelp
        label="② やりたいことを選ぶ"
        labelClassName="text-lg font-semibold text-stone-900"
        helpAriaLabel="ログハウスの操作説明"
        help={
          <p>
            選んだプロフィールの日記を書いたり、記録や本棚・鑑定結果を開けます。
          </p>
        }
      />

      <div className="flex w-full flex-col gap-3">
        {showCompanionWriting ? (
          <ProfileSelectNavButton
            profileId={profileId}
            href={companionWritingHref}
            directNav={isActive}
            loadingLabel={`${COMPANION_WRITING_FORMAL_TITLE}画面を開いています…`}
            className={navButtonClass}
          >
            <MyPageActionCard
              illustration={myPageActionIllustrations.writeDiary}
              title={<CompanionWritingButtonLabel />}
              description="今日の気分から、短く書き始めます"
              tone="emerald"
              emphasis={companionEmphasis}
            />
          </ProfileSelectNavButton>
        ) : null}

        {journalBlocked ? (
          <div className="space-y-2">
            <MyPageActionCard
              illustration={myPageActionIllustrations.writeDiary}
              title="日記を書く"
              description="今日の出来事や気持ちを記録します"
              tone="emerald"
              disabled
            />
            <Link
              href="/plans"
              className="block text-center text-xs font-medium text-violet-800 underline-offset-2 hover:underline"
            >
              サブスクリプションのご案内
            </Link>
          </div>
        ) : (
          <ProfileSelectNavButton
            profileId={profileId}
            href="/orders/calendar"
            directNav={isActive}
            loadingLabel="日記を開いています…"
            className={navButtonClass}
          >
            <MyPageActionCard
              illustration={myPageActionIllustrations.writeDiary}
              title={journalEmphasis ? "はじめての日記を書く" : "日記を書く"}
              description="今日の出来事や気持ちを記録します"
              tone="emerald"
              emphasis={journalEmphasis}
            />
          </ProfileSelectNavButton>
        )}

        <ProfileSelectNavButton
          profileId={profileId}
          href="/orders/list"
          directNav={isActive}
          loadingLabel="日記一覧を開いています…"
          className={navButtonClass}
        >
          <MyPageActionCard
            illustration={myPageActionIllustrations.readDiary}
            title="日記を読む"
            description="書いた記録を読みやすく見返します"
            tone="wood"
          />
        </ProfileSelectNavButton>

        <ProfileSelectNavButton
          profileId={profileId}
          href="/orders/bookshelf"
          directNav={isActive}
          loadingLabel="本棚を準備しています…"
          className={navButtonClass}
        >
          <MyPageActionCard
            illustration={myPageActionIllustrations.bookshelf}
            title="本棚を見る"
            description="育ってきた本や記録を見ます"
            tone="shelf"
          />
        </ProfileSelectNavButton>

        {kanteiOrderId ? (
          <Link
            href={`/orders/${encodeURIComponent(kanteiOrderId)}`}
            className={navButtonClass}
          >
            <MyPageActionCard
              illustration={myPageActionIllustrations.fortune}
              title="鑑定結果を見る"
              description="今日のヒントや今年のテーマを確認します"
              supplementLabel="毎日更新"
              tone="fortune"
            />
          </Link>
        ) : null}
      </div>
    </section>
  );
}
