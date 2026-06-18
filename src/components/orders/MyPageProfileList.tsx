"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FieldLabelWithHelp } from "@/components/ui/InlineHelpButton";
import { selectViewerProfile } from "@/lib/profile/selectViewerProfile";

type ProfileRow = { id: string; nickname: string };

type Props = {
  profiles: ProfileRow[];
  activeProfileId: string;
};

/** マイページ：プロフィールを選ぶ */
export function MyPageProfileList({ profiles, activeProfileId }: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function selectProfile(profileId: string) {
    if (busyId) return;
    setError(null);
    setBusyId(profileId);
    try {
      if (profileId !== activeProfileId) {
        const result = await selectViewerProfile(profileId);
        if (!result.ok) {
          setError(result.error);
          return;
        }
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }


  return (
    <section id="profile-list" className="space-y-3">
      <div>
        <FieldLabelWithHelp
          label="① プロフィールを選ぶ"
          labelClassName="text-lg font-semibold text-stone-900"
          helpAriaLabel="プロフィール一覧の説明"
          help={
            <>
              <p>使うプロフィールを選んでから、下の「やりたいことを選ぶ」へ進んでください。</p>
              <p className="mt-1.5">
                プロフィールの追加は
                <Link
                  href="/orders/settings/add-profile"
                  className="font-medium text-stone-800 underline-offset-2 hover:underline"
                >
                  こちら
                </Link>
                からできます。
              </p>
              <p className="mt-1.5">家族やテーマごとに、記録を分けて残せます。</p>
            </>
          }
        />
      </div>
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      {profiles.length === 0 ? (
        <p className="lj-read-desc text-stone-600">プロフィールがまだありません。下から追加してください。</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => {
            const isActive = profile.id === activeProfileId;
            const isBusy = busyId === profile.id;
            return (
              <li key={profile.id} className="pt-2.5">
                <div className="relative">
                  {isActive ? (
                    <span className="absolute -top-2.5 left-3 z-10 rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold leading-none text-emerald-800 ring-1 ring-emerald-400">
                      選択中
                    </span>
                  ) : null}
                  <button
                    type="button"
                    disabled={busyId !== null}
                    aria-busy={isBusy}
                    aria-current={isActive ? "true" : undefined}
                    aria-label={
                      isBusy
                        ? `${profile.nickname}に切り替え中`
                        : isActive
                          ? `${profile.nickname}（選択中）`
                          : `${profile.nickname}を選ぶ`
                    }
                    onClick={() => void selectProfile(profile.id)}
                    className={[
                      "block w-full rounded-xl border-2 bg-white px-4 py-4 text-center text-sm font-medium shadow-sm transition",
                      isActive
                        ? "border-emerald-400 text-emerald-950"
                        : "border-stone-200 text-stone-900 hover:border-stone-300 hover:bg-stone-50/80",
                      isBusy ? "scale-[0.98] opacity-80" : "active:scale-[0.98]",
                      busyId !== null && !isBusy ? "disabled:opacity-60" : "",
                    ].join(" ")}
                  >
                    {profile.nickname}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
