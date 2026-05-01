"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type ProfileOption = { id: string; nickname: string };

type Props = {
  profiles: ProfileOption[];
  activeProfileId: string | null;
};

export function ProfileSwitcher({ profiles, activeProfileId }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState(activeProfileId ?? "");
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profileCount = useMemo(() => profiles.length, [profiles]);

  async function selectProfile(nextId: string) {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/profiles/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ profileId: nextId }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "プロフィール切替に失敗しました。");
        return;
      }
      setSelected(nextId);
      router.refresh();
    } catch {
      setError("プロフィール切替に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  async function createProfile() {
    setError(null);
    const v = nickname.trim();
    if (!v) {
      setError("ニックネームを入力してください。");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ nickname: v }),
      });
      const data = (await res.json()) as { error?: string; profile?: ProfileOption };
      if (!res.ok || !data.profile) {
        setError(data.error ?? "プロフィール作成に失敗しました。");
        return;
      }
      setNickname("");
      await selectProfile(data.profile.id);
    } catch {
      setError("プロフィール作成に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-stone-900">プロフィールを選ぶ</p>
      <p className="mt-1 text-xs text-stone-600">
        日記・鑑定・本棚は、選択中プロフィールに紐づきます（現在 {profileCount}件）。
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={selected}
          onChange={(e) => void selectProfile(e.target.value)}
          disabled={busy || profiles.length === 0}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        >
          {profiles.length === 0 ? <option value="">プロフィール未作成</option> : null}
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nickname}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="新しいプロフィール名（例: 自分 / 長女）"
          className="w-full max-w-xs rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => void createProfile()}
          className="rounded-md bg-stone-800 px-3 py-2 text-xs font-medium text-white hover:bg-stone-700 disabled:opacity-60"
        >
          追加
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
