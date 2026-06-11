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

/** マイページ：プロフィールを選ぶ（詳細ページへは自動遷移しない） */
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

  const multiple = profiles.length > 1;

  return (
    <section id="profile-list" className="space-y-3">
      <div>
        <FieldLabelWithHelp
          label="① プロフィールを選ぶ"
          labelClassName="text-lg font-semibold text-stone-900"
          helpAriaLabel="プロフィール一覧の説明"
          help={
            <>
              <p>プロフィールごとに、日記・鑑定書・本棚が分かれます。</p>
              <p className="mt-1.5">家族やペット、テーマごとに記録を分けたいときに使います。</p>
              <p className="mt-1.5">
                {multiple
                  ? "使うプロフィールを選んでから、下の「日記を書く」「本棚を見る」へ進んでください。"
                  : "このプロフィールで、下の「日記を書く」「本棚を見る」が使えます。"}
              </p>
            </>
          }
        />
        <p className="mt-1 hidden text-sm text-stone-600 sm:block">
          {multiple
            ? "使うプロフィールを選んでから、下の「日記を書く」「本棚を見る」へ進んでください。"
            : "このプロフィールで、下の「日記を書く」「本棚を見る」が使えます。"}
        </p>
      </div>
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      {profiles.length === 0 ? (
        <p className="text-sm text-stone-600">プロフィールがまだありません。下から追加してください。</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {profiles.map((profile) => {
            const isActive = profile.id === activeProfileId;
            const isBusy = busyId === profile.id;
            const profileDetailHref = `/orders/profile/${encodeURIComponent(profile.id)}`;
            return (
              <li key={profile.id} className={isActive ? "pt-2.5" : undefined}>
                <div
                  className={[
                    "relative rounded-xl border bg-white shadow-sm transition",
                    isActive ? "border-2 border-emerald-400" : "border-stone-200",
                  ].join(" ")}
                >
                  {isActive ? (
                    <span className="absolute -top-2.5 left-3 rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold leading-none text-emerald-800 ring-1 ring-emerald-400">
                      選択中
                    </span>
                  ) : null}
                  <button
                    type="button"
                    disabled={busyId !== null}
                    aria-busy={isBusy}
                    aria-current={isActive ? "true" : undefined}
                    onClick={() => void selectProfile(profile.id)}
                    className={[
                      "block w-full rounded-t-xl px-4 py-4 text-left text-sm transition hover:bg-stone-50/80 disabled:opacity-60",
                      isBusy ? "scale-[0.98] opacity-80" : "active:scale-[0.98]",
                    ].join(" ")}
                  >
                    <p className="font-medium text-stone-900">{profile.nickname}</p>
                    {!isActive ? (
                      <p className="mt-2 text-xs font-medium text-emerald-900">
                        {isBusy ? "切り替え中…" : "このプロフィールを選ぶ"}
                      </p>
                    ) : isBusy ? (
                      <p className="mt-2 text-xs font-medium text-emerald-900">切り替え中…</p>
                    ) : null}
                  </button>
                  <div className="border-t border-stone-100 px-4 py-2.5">
                    <Link
                      href={profileDetailHref}
                      className="text-xs font-medium text-emerald-900 underline-offset-2 hover:underline"
                    >
                      プロフィール名の変更・保存済み鑑定 →
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
