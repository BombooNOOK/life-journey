import Link from "next/link";
import { notFound } from "next/navigation";

import { KanteiTodayHintSection } from "@/components/orders/KanteiTodayHintSection";
import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { buildTodayHintContent } from "@/lib/kantei/todayHintContent";
import { personalMonthEntry } from "@/lib/numerology/data/personalMonthData";
import { personalYearCycleEntry } from "@/lib/numerology/data/personalYearCycleData";
import {
  personalMonthNumber,
  personalYearNumber,
} from "@/lib/numerology/personalYearMonth";
import { numerologyWithRefreshedLifePath } from "@/lib/order/numerologyDisplay";
import { LOG_HOUSE_BACK_LINK } from "@/lib/journal/logHouseLabels";
import { KANTEI_HALL_PAGE_PATH } from "@/lib/kantei/kanteiHallCopy";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) notFound();

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
  if (normalizeEmail(order.email) !== viewerEmail) notFound();

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

  const todayHint = buildTodayHintContent({
    orderId: order.id,
    birthMonth: order.birthMonth,
    birthDay: order.birthDay,
  });
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const yearCycle = personalYearNumber(order.birthMonth, order.birthDay, currentYear);
  const yearTheme = personalYearCycleEntry(yearCycle);
  const monthCycle = personalMonthNumber(yearCycle, currentMonth);
  const monthTheme = personalMonthEntry(monthCycle);
  const showDevDetails = process.env.NODE_ENV === "development";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/orders" className="text-sm text-stone-600 hover:text-stone-900">
          {LOG_HOUSE_BACK_LINK.label}
        </Link>
      </div>

      <KanteiTodayHintSection hint={todayHint} />

      <section
        id="year-theme"
        className="scroll-mt-6 rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-stone-900">今年のテーマ</h2>
        <p className="mt-2 text-sm text-stone-500">
          {currentYear}年・パーソナルイヤー {yearCycle}
        </p>
        <p className="mt-1 text-base font-medium text-stone-900">{yearTheme.theme}</p>
        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-stone-600">{yearTheme.subtitle}</p>
      </section>

      <section
        id="month-theme"
        className="scroll-mt-6 rounded-xl border border-stone-200 bg-white p-5 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-stone-900">今月のテーマ</h2>
        <p className="mt-2 text-sm text-stone-500">
          {currentYear}年{currentMonth}月・パーソナルマンス {monthCycle}
        </p>
        <p className="mt-1 text-base font-medium text-stone-900">{monthTheme.theme}</p>
        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-stone-600">{monthTheme.subtitle}</p>
      </section>

      <p className="rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm leading-6 text-stone-600">
        コアナンバーなど、鑑定書の数字をもう一度見たいときは、{" "}
        <Link
          href={KANTEI_HALL_PAGE_PATH}
          className="font-medium text-emerald-900 underline-offset-2 hover:underline"
        >
          鑑定のへや
        </Link>
        へどうぞ。
      </p>

      <div>
        <Link
          href="/orders"
          className="text-sm text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline"
        >
          {LOG_HOUSE_BACK_LINK.label}
        </Link>
      </div>

      {showDevDetails ? (
        <details className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs text-stone-600">
          <summary className="cursor-pointer font-medium text-stone-700">開発用情報</summary>
          <div className="mt-2 space-y-1">
            <p>注文ID: {order.id}</p>
            <p>ステータス: {order.status}</p>
            <p>登録: {order.createdAt.toLocaleString("ja-JP")}</p>
            <p>
              入力修正可能: {(order.identityCorrectionCount ?? 0) === 0 ? "はい（1回まで）" : "いいえ（利用済み）"}
            </p>
            <p>
              LP: {numerology.lifePathNumber} / PY: {yearCycle} / PM: {monthCycle}
            </p>
          </div>
        </details>
      ) : null}
    </div>
  );
}
