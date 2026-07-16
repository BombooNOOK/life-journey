import { notFound } from "next/navigation";

import { DailyFortunePageClient } from "@/components/orders/daily-fortune/DailyFortunePageClient";
import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";
import { calendarDayKeyInJapanFromDate } from "@/lib/date/japanCalendarDate";
import { prisma } from "@/lib/db";
import { buildTodayHintContent } from "@/lib/kantei/todayHintContent";
import { resolveDailyFortuneColorAsset } from "@/lib/ljd/dailyFortuneColors";
import { pickDailyFortuneGuide } from "@/lib/ljd/dailyFortuneGuides";
import { personalMonthEntry } from "@/lib/numerology/data/personalMonthData";
import { personalYearCycleEntry } from "@/lib/numerology/data/personalYearCycleData";
import {
  personalMonthNumber,
  personalYearNumber,
} from "@/lib/numerology/personalYearMonth";
import { numerologyWithRefreshedLifePath } from "@/lib/order/numerologyDisplay";

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

  const guide = pickDailyFortuneGuide({
    email: order.email,
    profileId: order.profileId || "",
    dateKey: calendarDayKeyInJapanFromDate(now),
  });
  const color = resolveDailyFortuneColorAsset(todayHint.guardianColor);

  return (
    <DailyFortunePageClient
      guide={guide}
      message={todayHint.message}
      smallAction={todayHint.smallAction}
      color={color}
      yearTheme={{
        title: "今年のテーマ",
        headline: yearTheme?.theme ?? null,
        body: yearTheme?.subtitle ?? null,
      }}
      monthTheme={{
        title: "今月のテーマ",
        headline: monthTheme?.theme ?? null,
        body: monthTheme?.subtitle ?? null,
      }}
    />
  );
}
