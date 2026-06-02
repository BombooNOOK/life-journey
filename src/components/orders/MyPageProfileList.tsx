"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { FieldLabelWithHelp } from "@/components/ui/InlineHelpButton";
import { selectViewerProfile } from "@/lib/profile/selectViewerProfile";

type ProfileRow = { id: string; nickname: string };

type Props = {
  profiles: ProfileRow[];
  activeProfileId: string;
};

export function MyPageProfileList({ profiles, activeProfileId }: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function openProfile(profileId: string) {
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
      router.push(`/orders/profile/${encodeURIComponent(profileId)}`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section id="profile-list" className="space-y-3">
      <div>
        <FieldLabelWithHelp
          label="プロフィール一覧"
          labelClassName="text-lg font-semibold text-stone-900"
          helpAriaLabel="プロフィール一覧の説明"
          help={
            <>
              <p>プロフィールごとに、日記・鑑定書・本棚が分かれます。</p>
              <p className="mt-1.5">家族やペット、テーマごとに記録を分けたいときに使います。</p>
            </>
          }
        />
        <p className="mt-1 text-sm text-stone-600">日記を書くプロフィールを選びます。</p>
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
            return (
              <li key={profile.id}>
                <button
                  type="button"
                  disabled={busyId !== null}
                  onClick={() => void openProfile(profile.id)}
                  className={[
                    "block w-full rounded-xl border bg-white px-4 py-4 text-left text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60",
                    isActive
                      ? "border-emerald-300 ring-1 ring-emerald-100"
                      : "border-stone-200 hover:border-stone-300",
                  ].join(" ")}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-stone-900">{profile.nickname}</p>
                    {isActive ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-900">
                        現在選択中
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs font-medium text-emerald-900">
                    {isBusy ? "切り替え中…" : "このプロフィールを開く →"}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
