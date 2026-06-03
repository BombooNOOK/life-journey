"use client";

import { ProfileSelectNavButton } from "@/components/profile/ProfileSelectNavButton";

type Props = {
  profileId: string;
  profileNickname: string;
  isActive: boolean;
};

const mainNavButtonClass =
  "flex min-h-[52px] w-full items-center justify-center rounded-xl border px-4 py-3.5 text-center text-sm font-semibold shadow-sm transition hover:shadow disabled:opacity-60";

/** マイページトップ：選択中プロフィール向けの主導線 */
export function MyPageMainActions({ profileId, profileNickname, isActive }: Props) {
  return (
    <section id="main-actions" className="space-y-3">
      <div>
        <p className="text-lg font-semibold text-stone-900">② つぎに進む</p>
        <p className="mt-1 text-sm text-stone-600">
          日記の記入と、鑑定書・日記ブックの本棚はこちらから。
        </p>
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
          <ProfileSelectNavButton
            profileId={profileId}
            href="/orders/calendar"
            directNav={isActive}
            loadingLabel="日記を開いています…"
            className={`${mainNavButtonClass} border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-white text-emerald-900 hover:border-emerald-300 hover:bg-emerald-50`}
          >
            日記を書く・編集する
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
        </div>
      </div>
    </section>
  );
}
