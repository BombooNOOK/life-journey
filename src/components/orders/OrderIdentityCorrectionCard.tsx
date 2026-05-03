"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { formatYearOptionLabel } from "@/lib/date/japaneseEra";
import { daysInMonth } from "@/lib/order/birthDate";
import { isHiraganaOnly } from "@/lib/validation/hiragana";

const MIN_YEAR = 1870;

function yearRange(): number[] {
  const max = new Date().getFullYear();
  const ys: number[] = [];
  for (let y = max; y >= MIN_YEAR; y--) ys.push(y);
  return ys;
}

type Props = {
  orderId: string;
  initialLastName: string;
  initialFirstName: string;
  initialLastNameKana: string;
  initialFirstNameKana: string;
  initialBirthYear: number;
  initialBirthMonth: number;
  initialBirthDay: number;
  /** false のときカードを出さない */
  canCorrect: boolean;
};

export function OrderIdentityCorrectionCard({
  orderId,
  initialLastName,
  initialFirstName,
  initialLastNameKana,
  initialFirstNameKana,
  initialBirthYear,
  initialBirthMonth,
  initialBirthDay,
  canCorrect,
}: Props) {
  const router = useRouter();
  const years = useMemo(() => yearRange(), []);

  const [lastName, setLastName] = useState(initialLastName);
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastNameKana, setLastNameKana] = useState(initialLastNameKana);
  const [firstNameKana, setFirstNameKana] = useState(initialFirstNameKana);
  const [birthYear, setBirthYear] = useState(initialBirthYear);
  const [birthMonth, setBirthMonth] = useState(initialBirthMonth);
  const [birthDay, setBirthDay] = useState(initialBirthDay);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const clampDay = useCallback((y: number, m: number, d: number) => {
    const maxD = daysInMonth(y, m);
    return Math.min(d, maxD);
  }, []);

  if (!canCorrect) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!lastName.trim() || !firstName.trim()) {
      setError("姓・名を入力してください。");
      return;
    }
    if (!lastNameKana.trim() || !firstNameKana.trim()) {
      setError("ふりがな（せい・めい）を入力してください。");
      return;
    }
    if (!isHiraganaOnly(lastNameKana.trim()) || !isHiraganaOnly(firstNameKana.trim())) {
      setError("ふりがなはひらがなのみで入力してください。");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/identity`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lastName: lastName.trim(),
          firstName: firstName.trim(),
          lastNameKana: lastNameKana.trim(),
          firstNameKana: firstNameKana.trim(),
          birthYear,
          birthMonth,
          birthDay,
        }),
      });
      const data = (await res.json()) as { error?: string; code?: string };
      if (!res.ok) {
        setError(data.error ?? "保存に失敗しました。");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("通信に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-rose-100 bg-rose-50/80 p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-stone-900">お名前・生年月日の修正（1回のみ）</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        誤入力がある場合に限り、ここから一度だけ修正できます。保存すると数秘・守護石の結果が再計算されます。
      </p>
      {!open ? (
        <button
          type="button"
          className="mt-4 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-900 hover:bg-rose-50"
          onClick={() => setOpen(true)}
        >
          修正フォームを開く
        </button>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-stone-700">姓</span>
              <input
                className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-stone-700">名</span>
              <input
                className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-stone-700">せい（ひらがな）</span>
              <input
                className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900"
                value={lastNameKana}
                onChange={(e) => setLastNameKana(e.target.value)}
                placeholder="やまだ"
                required
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-stone-700">めい（ひらがな）</span>
              <input
                className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900"
                value={firstNameKana}
                onChange={(e) => setFirstNameKana(e.target.value)}
                placeholder="たろう"
                required
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm">
              <span className="font-medium text-stone-700">年</span>
              <select
                className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900"
                value={birthYear}
                onChange={(e) => {
                  const y = Number(e.target.value);
                  setBirthYear(y);
                  setBirthDay((d) => clampDay(y, birthMonth, d));
                }}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {formatYearOptionLabel(y)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-stone-700">月</span>
              <select
                className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900"
                value={birthMonth}
                onChange={(e) => {
                  const m = Number(e.target.value);
                  setBirthMonth(m);
                  setBirthDay((d) => clampDay(birthYear, m, d));
                }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {m}月
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-stone-700">日</span>
              <select
                className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900"
                value={birthDay}
                onChange={(e) => setBirthDay(Number(e.target.value))}
              >
                {Array.from({ length: daysInMonth(birthYear, birthMonth) }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}日
                  </option>
                ))}
              </select>
            </label>
          </div>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-60"
            >
              {loading ? "保存中…" : "この内容で一度だけ保存"}
            </button>
            <button
              type="button"
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm text-stone-800 hover:bg-stone-50"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              キャンセル
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
