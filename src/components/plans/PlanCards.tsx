"use client";

import { useState } from "react";

import { deriveSubscriptionPlanLabel, type SubscriptionPlanId } from "@/lib/stripe/plans";

type CheckoutPlan = SubscriptionPlanId;

async function startCheckout(plan: CheckoutPlan): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ plan }),
    });
    const data = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !data.url) {
      return { ok: false, error: data.error ?? "Checkout の開始に失敗しました。" };
    }
    window.location.href = data.url;
    return { ok: true };
  } catch {
    return { ok: false, error: "Checkout の開始に失敗しました。" };
  }
}

function PlanSubscribeButton({
  plan,
  label,
  className,
}: {
  plan: CheckoutPlan;
  label: string;
  className: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setError(null);
          setBusy(true);
          void startCheckout(plan).then((result) => {
            if (!result.ok) {
              setError(result.error);
              setBusy(false);
            }
          });
        }}
        className={className}
      >
        {busy ? "Stripeへ移動中…" : label}
      </button>
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

export function PlanCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <article className="flex flex-col rounded-2xl border border-emerald-200 bg-gradient-to-br from-white to-emerald-50/80 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">
          {deriveSubscriptionPlanLabel("light")}
        </h2>
        <p className="mt-1 text-2xl font-bold text-emerald-900">月額300円</p>
        <p className="mt-3 text-sm leading-relaxed text-stone-700">
          日記・本棚・鑑定書PDFを継続して利用できる基本プランです。プロフィール上限は1です。
        </p>
        <p className="mt-2 text-sm text-stone-600">現在はフクロウ先生テンプレートに対応しています。</p>
        <ul className="mt-3 list-inside list-disc text-xs text-stone-600">
          <li>日記機能</li>
          <li>本棚ページ</li>
          <li>鑑定書PDF（軽量版）の閲覧／ダウンロード</li>
        </ul>
        <div className="mt-5">
          <PlanSubscribeButton
            plan="light"
            label="ライトプランを申し込む"
            className="w-full rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-60"
          />
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-stone-500">
          ※Stripe の安全な決済ページへ移動します（カード決済）。
        </p>
      </article>

      <article className="flex flex-col rounded-2xl border border-violet-200 bg-gradient-to-br from-white to-violet-50/80 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">
          {deriveSubscriptionPlanLabel("standard")}
        </h2>
        <p className="mt-1 text-2xl font-bold text-violet-900">月額500円</p>
        <p className="mt-3 text-sm leading-relaxed text-stone-700">
          複数プロフィール（上限3）などに対応するプランです。
        </p>
        <ul className="mt-3 list-inside list-disc text-xs text-stone-600">
          <li>ライトプランの機能</li>
          <li>プロフィール上限: 3</li>
        </ul>
        <div className="mt-5">
          <PlanSubscribeButton
            plan="standard"
            label="スタンダードプランを申し込む"
            className="w-full rounded-lg bg-violet-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-900 disabled:opacity-60"
          />
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-stone-500">
          ※Stripe の安全な決済ページへ移動します（カード決済）。
        </p>
      </article>
    </div>
  );
}
