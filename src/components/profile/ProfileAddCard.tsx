"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { OwlLoadingInline } from "@/components/ui/OwlLoadingInline";

type Props = {
  profileCount: number;
  profileLimit: number;
  subscriptionPlan: string | null;
  blockContinuedFeatures?: boolean;
  showHeading?: boolean;
};

export function ProfileAddCard({
  profileCount,
  profileLimit,
  subscriptionPlan,
  blockContinuedFeatures = false,
  showHeading = true,
}: Props) {
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
      {showHeading ? <h2 className="text-lg font-semibold text-stone-900">プロフィールを追加</h2> : null}
      {blockContinuedFeatures && !atLimit ? (
        <div className={`${showHeading ? "mt-3" : ""} space-y-2 lj-read-desc text-stone-700`}>
          <p>新規プロフィールの追加は、はじめてのあしあとを残したあとご利用いただけます。</p>
          <p>まずはあしあとから残してみてください。</p>
        </div>
      ) : atLimit ? (
        isStandardPlanAtLimit ? (
          <div className="mt-3 space-y-3 lj-read-desc text-stone-700">
            <p>現在、1つのアカウントで作成できるプロフィールは最大3件までです。</p>
            <p>
              新しい記録を始めたい場合は、バックアップ・製本後に不要なプロフィールを整理する流れをおすすめしています。
            </p>
            <p>
              今後、さらに多くのプロフィールを記録できるしくみや、森のお預かり棚も検討中です。
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-3 lj-read-desc text-stone-700">
            <p>現在のご利用枠ではプロフィールを追加できません。</p>
            <p>プロフィールを増やすには、どんぐりと森の定期便のご案内をご確認ください。</p>
          </div>
        )
      ) : (
        <>
          <p className="mt-1 lj-read-caption text-stone-600">家族やテーマごとに記録を分けられます。</p>
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
              {busy ? (
                <OwlLoadingInline label="追加中…" size="sm" />
              ) : (
                "追加する"
              )}
            </button>
          </div>
          {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
        </>
      )}

      <div className="mt-4 border-t border-stone-100 pt-3">
        <Link
          href="/plans"
          className="inline-flex min-h-[44px] items-center rounded-lg border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-950 transition hover:bg-violet-100"
        >
          どんぐりと森の定期便 →
        </Link>
      </div>

      <div className="mt-4 border-t border-stone-100 pt-3 lj-read-caption leading-relaxed text-stone-500">
        <p>プロフィールの削除は、誤削除防止のため運営側で対応しています。</p>
        <p className="mt-1">
          削除をご希望の場合は、
          <Link href="/orders/support#contact-form" className="font-medium text-stone-700 underline-offset-2 hover:underline">
            お問い合わせ
          </Link>
          からご連絡ください。
        </p>
      </div>
    </section>
  );
}
