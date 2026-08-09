"use client";

import Link from "next/link";

import { PROFILE_CREATE_DISABLED_USER_MESSAGE } from "@/lib/profile/viewerProfileUiPolicy";

type Props = {
  profileCount: number;
  profileLimit: number;
  subscriptionPlan: string | null;
  blockContinuedFeatures?: boolean;
  showHeading?: boolean;
};

/** 新規記録枠追加は停止。案内のみ。 */
export function ProfileAddCard({ showHeading = true }: Props) {
  return (
    <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      {showHeading ? <h2 className="text-lg font-semibold text-stone-900">記録枠について</h2> : null}
      <div className={`${showHeading ? "mt-3" : ""} space-y-2 lj-read-desc text-stone-700`}>
        <p>{PROFILE_CREATE_DISABLED_USER_MESSAGE}</p>
        <p>
          アカウントや住民票の確認は
          <Link
            href="/orders/settings"
            className="mx-1 font-medium text-emerald-900 underline-offset-2 hover:underline"
          >
            設定
          </Link>
          から行えます。
        </p>
      </div>
    </section>
  );
}
