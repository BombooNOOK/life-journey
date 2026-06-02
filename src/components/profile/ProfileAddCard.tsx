"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  profileCount: number;
  profileLimit: number;
  subscriptionPlan: string | null;
};

export function ProfileAddCard({ profileCount, profileLimit, subscriptionPlan }: Props) {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const atLimit = profileCount >= profileLimit;
  const isStandardPlanAtLimit = atLimit && subscriptionPlan === "standard";

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
      const data = (await res.json()) as { error?: string; profile?: { id: string; nickname: string } };
      if (!res.ok || !data.profile) {
        setError(data.error ?? "プロフィール作成に失敗しました。");
        return;
      }
      setNickname("");
      const selectRes = await fetch("/api/profiles/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ profileId: data.profile.id }),
      });
      if (!selectRes.ok) {
        const selectData = (await selectRes.json()) as { error?: string };
        setError(selectData.error ?? "プロフィールは作成しましたが、選択の切り替えに失敗しました。");
        router.refresh();
        return;
      }
      router.refresh();
    } catch {
      setError("プロフィール作成に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-stone-900">プロフィールを追加</h2>
      {atLimit ? (
        isStandardPlanAtLimit ? (
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-stone-700">
            <p>現在、1つのアカウントで作成できるプロフィールは最大3件までです。</p>
            <p>
              新しい記録を始めたい場合は、バックアップ・製本後に不要なプロフィールを整理する流れをおすすめしています。
            </p>
            <p>今後、さらに多くのプロフィールを記録できるプレミアムプランも検討中です。</p>
          </div>
        ) : (
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-stone-700">
            <p>現在のプランではプロフィールを追加できません。</p>
            <p>プロフィールを増やすには、プラン変更が必要です。</p>
            <Link
              href="/plans"
              className="inline-flex rounded-lg border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-950 transition hover:bg-violet-100"
            >
              プランを見る
            </Link>
          </div>
        )
      ) : (
        <>
          <p className="mt-1 text-xs text-stone-600">家族やテーマごとに記録を分けられます。</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="新しいプロフィール名（例: 自分 / 長女）"
              disabled={busy}
              className="w-full max-w-xs rounded-md border border-stone-300 px-3 py-2 text-sm disabled:opacity-60"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => void createProfile()}
              className="rounded-md bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-60"
            >
              {busy ? "追加中…" : "追加する"}
            </button>
          </div>
          {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
        </>
      )}
    </section>
  );
}
