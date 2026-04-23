import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { numerologyWithRefreshedLifePath } from "@/lib/order/numerologyDisplay";
import { personalYearCycleEntry } from "@/lib/numerology/data/personalYearCycleData";
import { personalYearNumber } from "@/lib/numerology/personalYearMonth";
import { maturityNumberFromNumerology } from "@/lib/numerology/reduce";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

const CORE_NUMBER_COPY: Record<string, { mini: string; catch: string }> = {
  ライフパス: {
    mini: "生まれ持った性質",
    catch: "ひらめきを受け取り、ことばにする人",
  },
  ディスティニー: {
    mini: "社会での役割",
    catch: "才能を活かし、形にしていく人",
  },
  ソウル: {
    mini: "心の奥の願い",
    catch: "本音に正直で、愛を大切にする人",
  },
  パーソナリティ: {
    mini: "第一印象の魅力",
    catch: "穏やかさの中に芯を持つ人",
  },
  バースデー: {
    mini: "人生のギフト",
    catch: "自然体で人を照らす人",
  },
  マチュリティ: {
    mini: "成熟していく方向",
    catch: "経験を知恵に変えて導く人",
  },
};

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;

  let order: Awaited<ReturnType<typeof prisma.order.findUnique>>;
  try {
    order = await prisma.order.findUnique({ where: { id } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "データベースに接続できませんでした。";
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">
        <p className="font-semibold">注文を読み込めませんでした</p>
        <p className="mt-2 whitespace-pre-wrap">{msg}</p>
        <p className="mt-3 text-xs text-red-800">
          `DATABASE_URL` と `npx prisma db push` を確認してください。
        </p>
      </div>
    );
  }

  if (!order) notFound();

  const numerology = numerologyWithRefreshedLifePath(order.numerologyJson, order.birthDate, {
    birthYear: order.birthYear,
    birthMonth: order.birthMonth,
    birthDay: order.birthDay,
  });
  if (!numerology) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900">
        数秘データの読み込みに失敗しました。
      </div>
    );
  }

  const maturityNumber = maturityNumberFromNumerology(numerology);
  const currentYear = new Date().getFullYear();
  const yearCycle = personalYearNumber(order.birthMonth, order.birthDay, currentYear);
  const yearTheme = personalYearCycleEntry(yearCycle);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/orders" className="text-sm text-stone-600 hover:text-stone-900">
          ← マイページ
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">{order.fullNameDisplay} さんの最初の結果</h1>
        <p className="mt-1 text-sm text-stone-600">
          あなたのコアナンバーと、今年の流れをまとめました。
        </p>
      </div>

      <section className="rounded-2xl border border-amber-100 bg-gradient-to-br from-white to-amber-50 p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-900">
          あなたのコアナンバー
          <span aria-hidden>🦉</span>
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <CoreNumberCard label="ライフパス" value={numerology.lifePathNumber} />
          <CoreNumberCard label="ディスティニー" value={numerology.destinyNumber} />
          <CoreNumberCard label="ソウル" value={numerology.soulNumber} />
          <CoreNumberCard label="パーソナリティ" value={numerology.personalityNumber} />
          <CoreNumberCard label="バースデー" value={numerology.birthdayNumber} />
          <CoreNumberCard label="マチュリティ" value={maturityNumber} />
        </div>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">今年のテーマ</h2>
        <p className="mt-2 text-sm text-stone-500">パーソナルイヤー {yearCycle}</p>
        <p className="mt-1 text-base font-medium text-stone-900">{yearTheme.theme}</p>
        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-stone-600">{yearTheme.subtitle}</p>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-semibold text-stone-800">
          次に進む
          <span aria-hidden>🦉</span>
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={`/api/orders/${order.id}/pdf?download=0`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-stone-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-700"
          >
            詳しい鑑定書を見る（無料PDF）
          </a>
          <Link
            href={`/orders/${order.id}/today`}
            className="rounded-lg border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
          >
            今日のヒントを見る
          </Link>
          <Link
            href="/orders"
            className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-2.5 text-sm font-medium text-amber-800 hover:bg-amber-100"
          >
            Life Journey Diary へ
          </Link>
        </div>
        <p className="mt-2 text-xs text-stone-500">PDF生成に1分ほどかかる場合があります。</p>
      </section>

      <details className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs text-stone-600">
        <summary className="cursor-pointer font-medium text-stone-700">開発用情報</summary>
        <div className="mt-2 space-y-1">
          <p>注文ID: {order.id}</p>
          <p>ステータス: {order.status}</p>
          <p>登録: {order.createdAt.toLocaleString("ja-JP")}</p>
          <p>
            LP: {numerology.lifePathNumber} / Maturity: {maturityNumber}
          </p>
        </div>
      </details>
    </div>
  );
}

function CoreNumberCard({ label, value }: { label: string; value: number | null }) {
  const copy = CORE_NUMBER_COPY[label] ?? {
    mini: "このナンバーの意味",
    catch: "あなたらしさを映すサイン",
  };

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <p className="text-xs text-stone-500">{label}</p>
      <div className="mt-2 flex items-start justify-between gap-3">
        <p className="text-3xl font-semibold leading-none text-stone-900">{value ?? "—"}</p>
        <div className="text-right">
          <p className="text-xs text-stone-500">{copy.mini}</p>
          <p className="mt-1 text-sm font-medium leading-5 text-stone-800">{copy.catch}</p>
        </div>
      </div>
    </div>
  );
}
