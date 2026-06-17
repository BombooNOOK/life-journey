"use client";

import Link from "next/link";

import { FieldLabelWithHelp } from "@/components/ui/InlineHelpButton";
import { ProfileSelectNavButton } from "@/components/profile/ProfileSelectNavButton";
import type { SerializedUserEntitlement } from "@/lib/entitlement/resolveUserEntitlement";

type Props = {
  profileId: string;
  isActive: boolean;
  entitlement: SerializedUserEntitlement;
  kanteiOrderId: string | null;
};

const mainNavButtonClass =
  "flex min-h-[48px] w-full items-center justify-center rounded-xl border px-4 py-3.5 text-center text-base font-semibold shadow-sm transition hover:shadow disabled:cursor-not-allowed disabled:opacity-60";

const textLinkClass =
  "inline-flex min-h-[44px] items-center text-sm font-medium text-emerald-900 underline-offset-2 hover:underline";

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
  const journalExpired = entitlement.tier === "trial_expired";
  const profileDetailHref = `/orders/profile/${encodeURIComponent(profileId)}`;

  return (
    <section id="main-actions" className="space-y-3">
      <FieldLabelWithHelp
        label="② 何をしますか"
        labelClassName="text-lg font-semibold text-stone-900"
        helpAriaLabel="マイページの操作説明"
        help={
          <p>
            選んだプロフィールの日記を書いたり、これまでの記録や鑑定書を開けます。プロフィール名の変更もここから進められます。
          </p>
        }
      />

      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-[#f6f4ef] via-white to-emerald-50/40 p-4 shadow-sm sm:p-5">
        <div className="mx-auto flex w-full max-w-md flex-col gap-3">
          {journalExpired ? (
            <div className="space-y-2">
              <button
                type="button"
                disabled
                className={`${mainNavButtonClass} border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-white text-emerald-900`}
              >
                日記を書く・編集する
              </button>
              <Link
                href="/plans"
                className="block text-center text-xs font-medium text-violet-800 underline-offset-2 hover:underline"
              >
                サブスクリプションのご案内
              </Link>
            </div>
          ) : !canWriteJournal ? (
            <div className="space-y-2">
              <button
                type="button"
                disabled
                className={`${mainNavButtonClass} border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-white text-emerald-900`}
              >
                日記を書く・編集する
              </button>
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
              className={`${mainNavButtonClass} ${
                journalEmphasis
                  ? "border-emerald-400 bg-gradient-to-br from-emerald-100 to-white text-emerald-950 ring-2 ring-emerald-200/80"
                  : "border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-white text-emerald-900 hover:border-emerald-300 hover:bg-emerald-50"
              }`}
            >
              {journalEmphasis ? "はじめての日記を書く" : "日記を書く・編集する"}
            </ProfileSelectNavButton>
          )}

          <ProfileSelectNavButton
            profileId={profileId}
            href="/orders/list"
            directNav={isActive}
            loadingLabel="日記一覧を開いています…"
            className={`${mainNavButtonClass} border-emerald-200/70 bg-white text-emerald-900 hover:border-emerald-300 hover:bg-emerald-50/50`}
          >
            日記を読む
          </ProfileSelectNavButton>

          <ProfileSelectNavButton
            profileId={profileId}
            href="/orders/bookshelf"
            directNav={isActive}
            loadingLabel="本棚を準備しています…"
            className={`${mainNavButtonClass} border-violet-200/90 bg-gradient-to-br from-violet-50/80 to-white text-violet-900 hover:border-violet-300 hover:bg-violet-50`}
          >
            本棚を見る
          </ProfileSelectNavButton>

          <div className="mt-1 space-y-1 border-t border-stone-200/80 pt-3">
            <Link href={profileDetailHref} className={textLinkClass}>
              プロフィール名を変更する
            </Link>
            {kanteiOrderId ? (
              <Link href={`/orders/${encodeURIComponent(kanteiOrderId)}`} className={textLinkClass}>
                保存済み鑑定を見る
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
