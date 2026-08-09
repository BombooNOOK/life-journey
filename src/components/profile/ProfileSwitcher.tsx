"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { canShowAdminProfileSwitchUi } from "@/lib/profile/viewerProfileUiPolicy";

type ProfileOption = { id: string; nickname: string };

type Props = {
  profiles: ProfileOption[];
  activeProfileId: string | null;
  /** 管理者のみ表示。一般ユーザーには出さない */
  viewerIsAdmin?: boolean;
};

/** admin 互換：既存複数 Profile の切替のみ（追加なし） */
export function ProfileSwitcher({
  profiles,
  activeProfileId,
  viewerIsAdmin = false,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState(activeProfileId ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const show = useMemo(
    () =>
      canShowAdminProfileSwitchUi({
        isAdmin: viewerIsAdmin,
        profileCount: profiles.length,
      }),
    [viewerIsAdmin, profiles.length],
  );

  if (!show) return null;

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
        setError(data.error ?? "記録枠の切替に失敗しました。");
        return;
      }
      setSelected(nextId);
      router.refresh();
    } catch {
      setError("記録枠の切替に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm">
      <p className="text-sm font-semibold text-amber-950">管理者：既存の記録枠を切り替える</p>
      <p className="mt-1 text-xs text-amber-900/80">
        一般向けの複数記録枠機能は停止しています。過去データ確認用の切替です（現在 {profiles.length}件）。
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={selected}
          onChange={(e) => void selectProfile(e.target.value)}
          disabled={busy || profiles.length === 0}
          className="rounded-md border border-amber-300 bg-white px-3 py-2 text-sm"
        >
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nickname}
            </option>
          ))}
        </select>
      </div>
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
