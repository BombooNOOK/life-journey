"use client";

import Link from "next/link";

import { ProfileSelectNavButton } from "@/components/profile/ProfileSelectNavButton";
import type { SerializedUserEntitlement } from "@/lib/entitlement/resolveUserEntitlement";

type Props = {
  profileId: string;
  profileNickname: string;
  isActive: boolean;
  entitlement: SerializedUserEntitlement;
};

const mainNavButtonClass =
  "flex min-h-[52px] w-full items-center justify-center rounded-xl border px-4 py-3.5 text-center text-sm font-semibold shadow-sm transition hover:shadow disabled:cursor-not-allowed disabled:opacity-60";

/** マイページトップ：選択中プロフィール向けの主導線 */
export function MyPageMainActions({
  profileId,
  profileNickname,
  isActive,
  entitlement,
}: Props) {
  const canWriteJournal =
    entitlement.canUseContinuedFeatures || entitlement.canCreateFirstJournal;
  const journalEmphasis = entitlement.tier === "trial_not_started";
  const journalExpired = entitlement.tier === "trial_expired";

  return (
    <section id="main-actions" className="space-y-3">
      <div>
        <p className="text-lg font-semibold text-stone-900">② つぎに進む</p>
      </div>

      <div
        aria-label={`${profileNickname}さんの記録`}
        className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-[#f6f4ef] via-white to-emerald-50/40 p-4 shadow-sm sm:p-5"
      >
        <h2 className="text-lg font-semibold text-stone-900">
          {profileNickname}
          <span className="ml-2 text-sm font-normal text-stone-600">さんの記録</span>
        </h2>
        <div className="mt-4 grid w-full max-w-[17.5rem] grid-cols-1 gap-3 sm:max-w-2xl sm:grid-cols-2">
          {journalExpired ? (
            <div className="space-y-2">
              <ProfileSelectNavButton
                profileId={profileId}
                href="/orders/calendar"
                directNav={isActive}
                loadingLabel="日記を開いています…"
                className={`${mainNavButtonClass} border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-white text-emerald-900 hover:border-emerald-300 hover:bg-emerald-50`}
              >
                過去の日記を見る
              </ProfileSelectNavButton>
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
            href="/orders/bookshelf"
            directNav={isActive}
            loadingLabel="本棚を準備しています…"
            className={`${mainNavButtonClass} border-violet-200/90 bg-gradient-to-br from-violet-50/80 to-white text-violet-900 hover:border-violet-300 hover:bg-violet-50`}
          >
            本棚を見る
          </ProfileSelectNavButton>
        </div>
      </div>
    </section>
  );
}
