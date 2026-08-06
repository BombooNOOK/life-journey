"use client";

import Link from "next/link";

import { MyPageActionCard } from "@/components/orders/MyPageActionCard";
import { CompanionWritingButtonLabel } from "@/components/journal/companion-writing/CompanionWritingButtonLabel";
import { FieldLabelWithHelp } from "@/components/ui/InlineHelpButton";
import { ProfileSelectNavButton } from "@/components/profile/ProfileSelectNavButton";
import {
  TERM_FOOTPRINT_LEDGER,
  TERM_WRITE_FOOTPRINT,
} from "@/lib/journal/footprintTerminology";
import { myPageActionIllustrations } from "@/lib/mypage/myPageActionAssets";
import { COMPANION_WRITING_FORMAL_TITLE } from "@/lib/journal/companionWriting/types";
import type { SerializedUserEntitlement } from "@/lib/entitlement/resolveUserEntitlement";
import type { FirstVisitGuideState } from "@/lib/onboarding/firstVisitGuideState";
import {
  LOG_HOUSE_MAILBOX_PAGE_PATH,
  LOG_HOUSE_MAILBOX_UNREAD_LABEL,
} from "@/lib/loghouse/logHouseMailboxCopy";

type Props = {
  profileId: string;
  isActive: boolean;
  entitlement: SerializedUserEntitlement;
  kanteiOrderId: string | null;
  firstVisitGuideState: FirstVisitGuideState;
  companionWritingHref: string;
  mailboxUnreadCount?: number;
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
  mailboxUnreadCount = 0,
}: Props) {
  const canWriteJournal =
    entitlement.canUseContinuedFeatures || entitlement.canCreateFirstJournal;
  const journalEmphasis = false;
  const journalBlocked = !canWriteJournal;
  const showCompanionWriting =
    canWriteJournal && kanteiOrderId != null && firstVisitGuideState !== "needs_kantei";
  const companionEmphasis = firstVisitGuideState === "ready_first_journal";
  const hasMailboxUnread = mailboxUnreadCount > 0;

  return (
    <section id="main-actions" className="space-y-3">
      <FieldLabelWithHelp
        label="② やりたいことを選ぶ"
        labelClassName="text-lg font-semibold text-stone-900"
        helpAriaLabel="ログハウスの操作説明"
        help={
          <p>
            選んだプロフィールのあしあとを残したり、あしあと帳や本棚・ポスト・鑑定結果を開けます。森の住民票はアカウント共通です。
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
              illustration={myPageActionIllustrations.writeCompanion}
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
              title={TERM_WRITE_FOOTPRINT}
              description="今日の出来事や気持ちを記録します"
              tone="emerald"
              disabled
            />
            <Link
              href="/plans"
              className="block text-center text-xs font-medium text-violet-800 underline-offset-2 hover:underline"
            >
              どんぐりと森の定期便のご案内
            </Link>
          </div>
        ) : (
          <ProfileSelectNavButton
            profileId={profileId}
            href="/orders/calendar"
            directNav={isActive}
            loadingLabel={`${TERM_WRITE_FOOTPRINT}を開いています…`}
            className={navButtonClass}
          >
            <MyPageActionCard
              illustration={myPageActionIllustrations.writeDiary}
              title={journalEmphasis ? "はじめてのあしあと" : TERM_WRITE_FOOTPRINT}
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
          loadingLabel="あしあと帳を開いています…"
          className={navButtonClass}
        >
          <MyPageActionCard
            illustration={myPageActionIllustrations.readDiary}
            title={TERM_FOOTPRINT_LEDGER}
            description="残したあしあとを読みやすく見返します"
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

        <ProfileSelectNavButton
          profileId={profileId}
          href={LOG_HOUSE_MAILBOX_PAGE_PATH}
          directNav={isActive}
          loadingLabel="ポストを開いています…"
          className={navButtonClass}
        >
          <MyPageActionCard
            illustration={myPageActionIllustrations.mailbox}
            title="ポストを見る"
            description="ヤギさん郵便や、森からのお手紙を受け取ります"
            tone="wood"
            emphasis={hasMailboxUnread}
            supplementLabel={hasMailboxUnread ? LOG_HOUSE_MAILBOX_UNREAD_LABEL : undefined}
          />
        </ProfileSelectNavButton>

        <Link href="/orders/resident-card" className={navButtonClass}>
          <MyPageActionCard
            illustration={myPageActionIllustrations.residentCard}
            title="森の住民票を見る"
            description="あなたの森の住民としてのカードを見ます"
            supplementLabel="アカウント共通"
            tone="wood"
          />
        </Link>

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
