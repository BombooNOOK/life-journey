import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { getPersonalDayOneLineMessageByBirthDate } from "@/lib/numerology/personalDayMessage";
import { personalYearNumber, personalMonthNumber, personalDayNumber } from "@/lib/numerology/personalYearMonth";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

const LUCKY_COLORS = ["赤", "オレンジ", "黄", "緑", "青", "藍", "紫", "ピンク", "ゴールド"];
const ACTION_HINTS = [
  "新しい一歩を小さく始める",
  "誰かにやさしい言葉をかける",
  "楽しいことを10分だけでもやる",
  "身の回りをひとつ整える",
  "少し冒険して、いつもと違う選択をする",
  "身近な人をサポートする",
  "静かな時間を作って振り返る",
  "やるべきことを一つ完了させる",
  "手放したいことをひとつ決める",
];

export default async function TodayHintPage({ params }: Props) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) notFound();

  const today = new Date();
  const py = personalYearNumber(order.birthMonth, order.birthDay, today.getFullYear());
  const pm = personalMonthNumber(py, today.getMonth() + 1);
  const pd = personalDayNumber(pm, today.getDate());
  const dayMessage = getPersonalDayOneLineMessageByBirthDate({
    birthMonth: order.birthMonth,
    birthDay: order.birthDay,
    date: today,
    userSeed: order.id,
  });

  const luckyColor = LUCKY_COLORS[(pd - 1 + LUCKY_COLORS.length) % LUCKY_COLORS.length];
  const actionHint = ACTION_HINTS[(pd - 1 + ACTION_HINTS.length) % ACTION_HINTS.length];

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/orders/${order.id}`} className="text-sm text-stone-600 hover:text-stone-900">
          ← 最初の結果へ戻る
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">今日のヒント</h1>
        <p className="mt-1 text-sm text-stone-600">
          {order.fullNameDisplay} さんの今日を、やさしく後押しするメッセージです。
        </p>
      </div>

      <section className="rounded-2xl border border-amber-100 bg-gradient-to-br from-white to-amber-50 p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-stone-700">
          今日のひとこと
          <span aria-hidden>🦉</span>
        </h2>
        <p className="mt-2 text-lg font-medium leading-8 text-stone-900">{dayMessage.message}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-stone-700">今日のラッキーカラー</h3>
          <p className="mt-2 text-2xl font-semibold text-amber-700">{luckyColor}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-stone-700">今日はどんなことする？</h3>
          <p className="mt-2 text-sm leading-7 text-stone-700">{actionHint}</p>
        </div>
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-stone-700">今日のガイド</h3>
        <p className="mt-2 text-sm leading-7 text-stone-600">
          パーソナルイヤー {py} ・パーソナルマンス {pm} ・パーソナルデイ {pd}
        </p>
      </section>

      <section className="rounded-xl border border-stone-200 bg-amber-50 p-5">
        <h3 className="text-sm font-semibold text-stone-700">今日の言葉を残す</h3>
        <p className="mt-2 text-sm text-stone-600">
          Life Journey Diaryに、今日の気づきを1行だけでも残してみましょう。
        </p>
        <Link
          href="/orders"
          className="mt-3 inline-block rounded-lg border border-amber-200 bg-white px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
        >
          Life Journey Diary へ
        </Link>
      </section>
    </div>
  );
}

