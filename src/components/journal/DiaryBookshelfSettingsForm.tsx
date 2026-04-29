"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { diaryDesignOptions, type DiaryDesignId } from "@/lib/journal/meta";

export type DiaryBookshelfBookClientSettings = {
  displayTitle: string | null;
  coverTheme: string;
  periodStartMonth: number;
  periodEndMonth: number;
};

export const DEFAULT_BOOKSHELF_BOOK_SETTINGS: DiaryBookshelfBookClientSettings = {
  displayTitle: null,
  coverTheme: "simple",
  periodStartMonth: 1,
  periodEndMonth: 12,
};

function monthOptions(): { value: number; label: string }[] {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}月`,
  }));
}

export function DiaryBookshelfSettingsForm({
  year,
  initialSettings,
  onSaved,
}: {
  year: number;
  initialSettings: DiaryBookshelfBookClientSettings;
  onSaved?: (next: DiaryBookshelfBookClientSettings) => void;
}) {
  const router = useRouter();
  const [displayTitle, setDisplayTitle] = useState(initialSettings.displayTitle ?? "");
  const [coverTheme, setCoverTheme] = useState<string>(initialSettings.coverTheme || "simple");
  const [periodStartMonth, setPeriodStartMonth] = useState(initialSettings.periodStartMonth);
  const [periodEndMonth, setPeriodEndMonth] = useState(initialSettings.periodEndMonth);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setDisplayTitle(initialSettings.displayTitle ?? "");
    setCoverTheme(initialSettings.coverTheme || "simple");
    setPeriodStartMonth(initialSettings.periodStartMonth);
    setPeriodEndMonth(initialSettings.periodEndMonth);
  }, [initialSettings]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/journal/bookshelf/${year}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayTitle,
          coverTheme,
          periodStartMonth,
          periodEndMonth,
        }),
      });
      const raw = await res.text();
      const data = (() => {
        try {
          return JSON.parse(raw) as {
            settings?: DiaryBookshelfBookClientSettings;
            error?: string;
          };
        } catch {
          return {} as { settings?: DiaryBookshelfBookClientSettings; error?: string };
        }
      })();
      if (!res.ok) {
        setMessage(data.error ?? "保存に失敗しました。");
        return;
      }
      if (data.settings) {
        onSaved?.(data.settings);
      }
      setMessage("保存しました");
      router.refresh();
      window.setTimeout(() => setMessage(null), 2000);
    } catch {
      setMessage("通信に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-stone-900">この本の設定</h2>
      <p className="mt-1 text-xs text-stone-600">
        表示名・表紙・製本に含める月の範囲を指定できます。空欄のときは「{year}
        年の記録」のような名前になります。
      </p>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-3 space-y-3">
        <label className="block">
          <span className="text-xs font-medium text-stone-700">本の名前（任意）</span>
          <input
            type="text"
            value={displayTitle}
            onChange={(e) => setDisplayTitle(e.target.value)}
            placeholder={`${year}年の記録`}
            maxLength={80}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none ring-stone-400 focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-stone-700">表紙の雰囲気</span>
          <select
            value={coverTheme}
            onChange={(e) => setCoverTheme(e.target.value as DiaryDesignId)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none ring-stone-400 focus:ring-2"
          >
            {diaryDesignOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-3">
          <label className="block min-w-[120px] flex-1">
            <span className="text-xs font-medium text-stone-700">製本に含める開始月</span>
            <select
              value={periodStartMonth}
              onChange={(e) => setPeriodStartMonth(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none ring-stone-400 focus:ring-2"
            >
              {monthOptions().map((m) => (
                <option key={m.value} value={m.value}>
                  {year}年{m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block min-w-[120px] flex-1">
            <span className="text-xs font-medium text-stone-700">製本に含める終了月</span>
            <select
              value={periodEndMonth}
              onChange={(e) => setPeriodEndMonth(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 outline-none ring-stone-400 focus:ring-2"
            >
              {monthOptions().map((m) => (
                <option key={m.value} value={m.value}>
                  {year}年{m.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-60"
        >
          {saving ? "保存中…" : "設定を保存"}
        </button>
        {message ? <p className="text-xs text-stone-600">{message}</p> : null}
      </form>
    </section>
  );
}
