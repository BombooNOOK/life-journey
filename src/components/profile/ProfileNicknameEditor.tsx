"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  profileId: string;
  initialNickname: string;
};

export function ProfileNicknameEditor({ profileId, initialNickname }: Props) {
  const router = useRouter();
  const [nickname, setNickname] = useState(initialNickname);
  const [savedNickname, setSavedNickname] = useState(initialNickname);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    setNickname(initialNickname);
    setSavedNickname(initialNickname);
  }, [initialNickname]);

  const trimmed = nickname.trim();
  const unchanged = trimmed === savedNickname;

  async function saveNickname() {
    setError(null);
    setSavedMessage(null);
    if (!trimmed) {
      setError("プロフィール名を入力してください。");
      return;
    }
    if (trimmed === savedNickname) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/profiles/${encodeURIComponent(profileId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ nickname: trimmed }),
      });
      const data = (await res.json()) as {
        error?: string;
        profile?: { id: string; nickname: string };
      };
      if (!res.ok || !data.profile) {
        setError(data.error ?? "プロフィール名の変更に失敗しました。");
        return;
      }
      setSavedNickname(data.profile.nickname);
      setNickname(data.profile.nickname);
      setSavedMessage("プロフィール名を変更しました。");
      router.refresh();
    } catch {
      setError("プロフィール名の変更に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-stone-700" htmlFor="profile-nickname">
          プロフィール名
        </label>
        <input
          id="profile-nickname"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          disabled={busy}
          maxLength={40}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 disabled:opacity-60"
        />
        <button
          type="button"
          disabled={busy || unchanged || !trimmed}
          onClick={() => void saveNickname()}
          className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-60"
        >
          {busy ? "保存中…" : "変更を保存"}
        </button>
      </div>
      <p className="text-xs leading-relaxed text-stone-500">
        40文字以内。ログハウスの一覧にも反映されます。
      </p>
      {error ? (
        <p className="text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {savedMessage ? (
        <p className="text-xs text-emerald-800" role="status">
          {savedMessage}
        </p>
      ) : null}
    </div>
  );
}
