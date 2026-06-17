"use client";

import Link from "next/link";

import { MyPageActionCard } from "@/components/orders/MyPageActionCard";
import { FieldLabelWithHelp } from "@/components/ui/InlineHelpButton";
import { ProfileSelectNavButton } from "@/components/profile/ProfileSelectNavButton";
import { myPageActionIllustrations } from "@/lib/mypage/myPageActionAssets";
import type { SerializedUserEntitlement } from "@/lib/entitlement/resolveUserEntitlement";

type Props = {
  profileId: string;
  isActive: boolean;
  entitlement: SerializedUserEntitlement;
  kanteiOrderId: string | null;
};

const navButtonClass =
  "block w-full rounded-2xl text-left transition-[transform,opacity] duration-75 active:scale-[0.99]";

/** マイページトップ：選択中プロフィールで何をするか */
export function MyPageMainActions({
  profileId,
  isActive,
  entitlement,
  kanteiOrderId,
}: Props) {
  const canWriteJournal =
    entitlement.canUseContinuedFeatures || entitlement.canCreateFirstJournal;
  const journalEmphasis = entitlement.tier === "trial_not_started";
  const journalBlocked = entitlement.tier === "trial_expired" || !canWriteJournal;

  return (
    <section id="main-actions" className="space-y-3">
      <FieldLabelWithHelp
        label="② やりたいことを選ぶ"
        labelClassName="text-lg font-semibold text-stone-900"
        helpAriaLabel="マイページの操作説明"
        help={
          <p>
            選んだプロフィールの日記を書いたり、記録や本棚・鑑定結果を開けます。
          </p>
        }
      />

      <div className="mx-auto flex w-full max-w-md flex-col gap-3">
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
              title="鑑定を見る"
              description="今年のテーマや今日のヒントを確認します"
              tone="fortune"
            />
          </Link>
        ) : null}
      </div>
    </section>
  );
}
