import Link from "next/link";
import { notFound } from "next/navigation";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { isAdminEmail } from "@/lib/admin/access";
import { listSocialPostDraftsForCalendar } from "@/lib/admin/post-atelier/queries";
import { SOCIAL_POST_DRAFT_STATUS_LABELS, SOCIAL_POST_PLATFORM_LABELS } from "@/lib/admin/post-atelier/types";
import { getCompanionLabel } from "@/lib/journal/meta";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ month?: string }>;
};

function currentMonthKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function parseMonth(raw: string | undefined): string {
  const value = raw?.trim() ?? "";
  if (/^\d{4}-\d{2}$/.test(value)) return value;
  return currentMonthKey();
}

function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-");
  return `${y}年${Number(m)}月`;
}

function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1 + delta, 1);
  const ny = date.getFullYear();
  const nm = String(date.getMonth() + 1).padStart(2, "0");
  return `${ny}-${nm}`;
}

function groupByScheduledDate<T extends { scheduledDate: string }>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const key = row.scheduledDate.trim();
    if (!key) continue;
    const arr = map.get(key) ?? [];
    arr.push(row);
    map.set(key, arr);
  }
  return map;
}

function buildMonthDays(monthKey: string): string[] {
  const [y, m] = monthKey.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const days: string[] = [];
  for (let d = 1; d <= lastDay; d += 1) {
    days.push(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }
  return days;
}

export default async function PostAtelierCalendarPage({ searchParams }: Props) {
  const viewerEmail = await getViewerEmailFromCookie();
  if (!(await isAdminEmail(viewerEmail))) {
    notFound();
  }

  const params = await searchParams;
  const month = parseMonth(params.month);
  const rows = await listSocialPostDraftsForCalendar(month);
  const grouped = groupByScheduledDate(rows);
  const days = buildMonthDays(month);

  const unscheduled = rows.filter((row) => !row.scheduledDate.trim());

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/post-atelier" className="text-sm text-stone-600 hover:text-stone-900">
          ← 投稿アトリエ
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">予定カレンダー</h1>
        <p className="mt-1 text-sm text-stone-600">
          予定日（scheduledDate）ごとの投稿案一覧です。SNS 自動投稿は行いません。
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/admin/post-atelier/calendar?month=${shiftMonth(month, -1)}`}
          className="rounded-md border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50"
        >
          ← 前月
        </Link>
        <p className="text-base font-semibold text-stone-900">{monthLabel(month)}</p>
        <Link
          href={`/admin/post-atelier/calendar?month=${shiftMonth(month, 1)}`}
          className="rounded-md border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50"
        >
          翌月 →
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {days.map((day) => {
          const dayRows = grouped.get(day) ?? [];
          return (
            <section
              key={day}
              className="rounded-xl border border-stone-200 bg-white p-3"
            >
              <h2 className="text-sm font-semibold text-stone-900">{day}</h2>
              {dayRows.length === 0 ? (
                <p className="mt-2 text-xs text-stone-400">予定なし</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {dayRows.map((row) => (
                    <li key={row.id}>
                      <Link
                        href={`/admin/post-atelier/${row.id}`}
                        className="block rounded-lg border border-stone-100 bg-stone-50 px-2 py-2 hover:border-violet-200 hover:bg-violet-50/40"
                      >
                        <p className="text-xs text-stone-500">
                          {SOCIAL_POST_DRAFT_STATUS_LABELS[row.status]} ／{" "}
                          {SOCIAL_POST_PLATFORM_LABELS[row.platform]} ／{" "}
                          {getCompanionLabel(row.companionType)}
                        </p>
                        <p className="mt-1 text-sm font-medium text-stone-900">
                          {row.theme.trim() || "（テーマ未入力）"}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {unscheduled.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-stone-900">予定日未設定</h2>
          <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
            {unscheduled.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/admin/post-atelier/${row.id}`}
                  className="block px-4 py-3 hover:bg-violet-50/40"
                >
                  <p className="font-medium text-stone-900">{row.theme.trim() || "（テーマ未入力）"}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {SOCIAL_POST_DRAFT_STATUS_LABELS[row.status]} ／{" "}
                    {getCompanionLabel(row.companionType)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
