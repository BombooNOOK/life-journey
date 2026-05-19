"use client";

import { BASE_LIGHT_SUBSCRIPTION_URL } from "@/lib/commerce/baseUrls";

function openBaseShop(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function PlanCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <LightPlanCard />
      <StandardPlanCard />
    </div>
  );
}

function LightPlanCard() {
  return (
    <article className="flex flex-col rounded-2xl border border-emerald-200 bg-gradient-to-br from-white to-emerald-50/80 p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-stone-900">ライトプラン</h2>
      <p className="mt-1 text-2xl font-bold text-emerald-900">月額300円</p>
      <p className="mt-3 text-sm leading-relaxed text-stone-700">
        14日間無料お試し終了後も、日記・本棚・鑑定書PDFを続けて利用できる基本プランです。
      </p>
      <p className="mt-2 text-sm text-stone-600">現在はフクロウ先生テンプレートに対応しています。</p>
      <ul className="mt-3 list-inside list-disc text-xs text-stone-600">
        <li>日記機能</li>
        <li>本棚ページ</li>
        <li>鑑定書PDF（軽量版）の閲覧／ダウンロード</li>
      </ul>
      <button
        type="button"
        onClick={() => openBaseShop(BASE_LIGHT_SUBSCRIPTION_URL)}
        className="mt-5 w-full rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-900"
      >
        ライトプランを申し込む
      </button>
      <p className="mt-3 text-[11px] leading-relaxed text-stone-500">
        ※BASEの商品ページへ移動します。
        <br />
        ※こちらは物品配送ではなく、月額利用プランです。BASEの画面に「毎月1回のお届け」等と表示されますが、実際の商品配送はありません。
      </p>
    </article>
  );
}

function StandardPlanCard() {
  return (
    <article className="flex flex-col rounded-2xl border border-stone-200 bg-stone-50/80 p-5 opacity-90">
      <h2 className="text-lg font-semibold text-stone-700">スタンダードプラン</h2>
      <p className="mt-1 text-2xl font-bold text-stone-600">月額500円</p>
      <p className="mt-1 inline-flex w-fit rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium text-stone-700">
        近日公開
      </p>
      <p className="mt-3 text-sm leading-relaxed text-stone-600">
        伴走キャラの選択や、複数プロフィールなどに対応予定のプランです。現在は準備中です。
      </p>
      <button
        type="button"
        disabled
        className="mt-5 w-full cursor-not-allowed rounded-lg border border-stone-300 bg-stone-200 px-4 py-2.5 text-sm font-medium text-stone-500"
      >
        近日公開
      </button>
    </article>
  );
}
