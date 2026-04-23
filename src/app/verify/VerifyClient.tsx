"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { daysInMonth, toIsoDateString } from "@/lib/order/birthDate";
import { computeNumerology } from "@/lib/numerology/compute";
import { romanizeFromKanaParts } from "@/lib/numerology/kanaToRomaji";
import {
  compareCoreFive,
  type ComparisonRow,
  snapshotFromNumerology,
  type CoreFiveSnapshot,
} from "@/lib/verification/coreFive";
import { expectedFromVerifyFields, type VerifyCaseFlat } from "@/lib/verification/verifyInput";
import { isHiraganaOnly } from "@/lib/validation/hiragana";

const STORAGE_KEY = "numerology-verify-saved-v1";

type SavedEntry = {
  id: string;
  savedAt: string;
  case: VerifyCaseFlat;
  actual: CoreFiveSnapshot;
  romanDisplay: string;
  allMatch: boolean;
};

type PreviewOk = {
  ok: true;
  iso: string;
  romanDisplay: string;
  romanNumerology: string;
  snap: CoreFiveSnapshot;
  rows: ComparisonRow[];
  allComparedMatch: boolean;
  hasAnyExpected: boolean;
};

type PreviewErr = { ok: false; message: string };

type Preview = PreviewOk | PreviewErr | null;

function yearRange(): number[] {
  const max = new Date().getFullYear();
  const ys: number[] = [];
  for (let y = max; y >= 1870; y--) ys.push(y);
  return ys;
}

export default function VerifyClient() {
  const years = useMemo(() => yearRange(), []);

  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastNameKana, setLastNameKana] = useState("");
  const [firstNameKana, setFirstNameKana] = useState("");
  const [birthYear, setBirthYear] = useState(1990);
  const [birthMonth, setBirthMonth] = useState(1);
  const [birthDay, setBirthDay] = useState(1);

  const [oldLp, setOldLp] = useState("");
  const [oldD, setOldD] = useState("");
  const [oldS, setOldS] = useState("");
  const [oldP, setOldP] = useState("");
  const [oldBd, setOldBd] = useState("");

  const [saved, setSaved] = useState<SavedEntry[]>([]);
  const [savedFilterMismatchOnly, setSavedFilterMismatchOnly] = useState(false);

  const clampDay = useCallback((y: number, m: number, d: number) => {
    const maxD = daysInMonth(y, m);
    return Math.min(d, maxD);
  }, []);

  const dayOptions = useMemo(() => {
    const maxD = daysInMonth(birthYear, birthMonth);
    return Array.from({ length: maxD }, (_, i) => i + 1);
  }, [birthYear, birthMonth]);

  const preview: Preview = useMemo(() => {
    try {
      if (!lastNameKana.trim() || !firstNameKana.trim()) return null;
      if (!isHiraganaOnly(lastNameKana) || !isHiraganaOnly(firstNameKana)) {
        return { ok: false, message: "ふりがなはひらがなのみにしてください。" };
      }
      const iso = toIsoDateString(birthYear, birthMonth, birthDay);
      const parts = {
        year: birthYear,
        month: birthMonth,
        day: birthDay,
      };
      const roman = romanizeFromKanaParts(
        lastNameKana.trim(),
        firstNameKana.trim(),
      );
      const numerology = computeNumerology({
        birthDate: parts,
        romanName:
          roman.romanNameForNumerology.trim().length > 0
            ? roman.romanNameForNumerology
            : null,
      });
      const snap = snapshotFromNumerology(numerology);
      const expected = expectedFromVerifyFields({ oldLp, oldD, oldS, oldP, oldBd });
      const { rows, allComparedMatch } = compareCoreFive(snap, expected);
      const hasAnyExpected = Object.keys(expected).length > 0;
      return {
        ok: true,
        iso,
        romanDisplay: roman.romanNameForDisplay,
        romanNumerology: roman.romanNameForNumerology,
        snap,
        rows,
        allComparedMatch,
        hasAnyExpected,
      };
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : "計算できません",
      };
    }
  }, [
    lastNameKana,
    firstNameKana,
    birthYear,
    birthMonth,
    birthDay,
    oldLp,
    oldD,
    oldS,
    oldP,
    oldBd,
  ]);

  const loadSaved = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SavedEntry[];
      if (Array.isArray(parsed)) setSaved(parsed);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const persistSaved = useCallback((next: SavedEntry[]) => {
    setSaved(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* quota */
    }
  }, []);

  const handleSaveCurrent = () => {
    if (!preview || !preview.ok) return;
    const flat: VerifyCaseFlat = {
      lastName,
      firstName,
      lastNameKana,
      firstNameKana,
      birthYear,
      birthMonth,
      birthDay,
      oldLp,
      oldD,
      oldS,
      oldP,
      oldBd,
    };
    const entry: SavedEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      savedAt: new Date().toISOString(),
      case: flat,
      actual: preview.snap,
      romanDisplay: preview.romanDisplay,
      allMatch: preview.hasAnyExpected ? preview.allComparedMatch : false,
    };
    persistSaved([entry, ...saved]);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(saved, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `numerology-verify-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const filteredSaved = savedFilterMismatchOnly
    ? saved.filter((s) => !s.allMatch)
    : saved;

  const mismatchCount = saved.filter((s) => !s.allMatch).length;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-stone-500">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="text-stone-500 no-underline hover:text-stone-800">
            トップ
          </a>
          {" · "}
          <Link href="/orders" className="hover:text-stone-800">
            注文一覧
          </Link>
          {" · "}
          <Link href="/preview" className="hover:text-stone-800">
            校正メニュー
          </Link>
          {" · "}
          <Link href="/preview/bridge-comments" className="hover:text-stone-800">
            ブリッジ一致度コメント
          </Link>
        </p>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">
          数秘コア5 検証（旧データとの突合）
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          姓・名・ふりがな・生年月日と、旧Excel等の正解値を入れると、アプリの計算結果と{" "}
          <span className="font-medium">○ / ×</span> が並びます。空欄の旧データ列は比較しません。
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-800">入力</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-stone-600">姓</span>
              <input
                className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-stone-600">名</span>
              <input
                className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-stone-600">せい（ひらがな）</span>
              <input
                className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
                value={lastNameKana}
                onChange={(e) => setLastNameKana(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-stone-600">めい（ひらがな）</span>
              <input
                className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"
                value={firstNameKana}
                onChange={(e) => setFirstNameKana(e.target.value)}
              />
            </label>
          </div>

          <h3 className="mt-4 text-sm font-semibold text-stone-800">生年月日</h3>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <select
              className="rounded-md border border-stone-300 px-2 py-2 text-sm"
              value={birthYear}
              onChange={(e) => {
                const y = Number(e.target.value);
                setBirthYear(y);
                setBirthDay((d) => clampDay(y, birthMonth, d));
              }}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}年
                </option>
              ))}
            </select>
            <select
              className="rounded-md border border-stone-300 px-2 py-2 text-sm"
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
            <select
              className="rounded-md border border-stone-300 px-2 py-2 text-sm"
              value={birthDay}
              onChange={(e) => setBirthDay(Number(e.target.value))}
            >
              {dayOptions.map((d) => (
                <option key={d} value={d}>
                  {d}日
                </option>
              ))}
            </select>
          </div>

          <h3 className="mt-4 text-sm font-semibold text-stone-800">旧データ（正解）</h3>
          <p className="mt-1 text-xs text-stone-500">
            比較しない項目は空欄。D/S/P が「無い」場合は{" "}
            <code className="rounded bg-stone-100 px-1">-</code> または{" "}
            <code className="rounded bg-stone-100 px-1">null</code>
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(
              [
                ["旧LP", oldLp, setOldLp],
                ["旧D", oldD, setOldD],
                ["旧S", oldS, setOldS],
                ["旧P", oldP, setOldP],
                ["旧BD", oldBd, setOldBd],
              ] as const
            ).map(([label, val, setVal]) => (
              <label key={label} className="block text-xs">
                <span className="text-stone-600">{label}</span>
                <input
                  className="mt-1 w-full rounded-md border border-stone-300 px-2 py-1.5 font-mono text-sm"
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  inputMode="numeric"
                />
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-800">計算結果・突合</h2>
          {preview === null ? (
            <p className="mt-3 text-sm text-stone-500">ふりがな（せい・めい）を入力してください。</p>
          ) : !preview.ok ? (
            <p className="mt-3 text-sm text-red-700">{preview.message}</p>
          ) : (
            <>
              <p className="mt-2 text-xs text-stone-500">
                生年月日（ISO）: <span className="font-mono">{preview.iso}</span>
              </p>
              <p className="mt-2 text-sm">
                <span className="text-stone-600">自動ローマ字（表示）</span>
                <br />
                <span className="font-mono font-medium text-stone-900">
                  {preview.romanDisplay}
                </span>
              </p>
              <p className="mt-1 text-xs text-stone-500">
                数秘用ローマ字:{" "}
                <span className="font-mono">{preview.romanNumerology}</span>
              </p>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[280px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-left text-stone-600">
                      <th className="py-2 pr-2">項目</th>
                      <th className="py-2 pr-2">新（アプリ）</th>
                      <th className="py-2 pr-2">旧</th>
                      <th className="py-2">一致</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row) => (
                      <tr key={row.key} className="border-b border-stone-100">
                        <td className="py-2 pr-2 text-stone-700">{row.label}</td>
                        <td className="py-2 pr-2 font-mono">
                          {row.actual === null || row.actual === undefined ? "—" : row.actual}
                        </td>
                        <td className="py-2 pr-2 font-mono text-stone-600">
                          {row.status === "skipped"
                            ? "（未入力）"
                            : row.expected === null
                              ? "null"
                              : row.expected}
                        </td>
                        <td className="py-2 text-lg">
                          {row.status === "skipped"
                            ? "—"
                            : row.status === "match"
                              ? "○"
                              : "×"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {preview.hasAnyExpected ? (
                <p className="mt-3 text-sm font-medium">
                  総合:{" "}
                  {preview.allComparedMatch ? (
                    <span className="text-emerald-700">すべて一致 ○</span>
                  ) : (
                    <span className="text-amber-800">差異あり（× を確認）</span>
                  )}
                </p>
              ) : (
                <p className="mt-3 text-xs text-stone-500">
                  旧データを1つ以上入れると突合が有効になります。
                </p>
              )}

              <button
                type="button"
                onClick={handleSaveCurrent}
                disabled={!preview || !preview.ok}
                className="mt-4 rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
              >
                この検証結果をブラウザに保存
              </button>
            </>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-dashed border-stone-300 bg-stone-50/80 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-stone-800">
            保存した検証（{saved.length} 件 / 不一致 {mismatchCount} 件）
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={savedFilterMismatchOnly}
                onChange={(e) => setSavedFilterMismatchOnly(e.target.checked)}
              />
              不一致のみ表示
            </label>
            <button
              type="button"
              onClick={exportJson}
              disabled={saved.length === 0}
              className="rounded border border-stone-300 bg-white px-3 py-1.5 text-stone-800 hover:bg-stone-100 disabled:opacity-50"
            >
              JSON をダウンロード
            </button>
          </div>
        </div>
        <p className="mt-1 text-xs text-stone-500">
          ブラウザの localStorage に保存します。別PCとは共有されません。将来 CSV
          一括と併せて、同じ JSON 形で取り込みやすいようにしてあります。
        </p>
        {filteredSaved.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">まだ保存がありません。</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {filteredSaved.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-medium text-stone-900">
                    {s.case.lastName} {s.case.firstName}
                  </span>
                  <span className="ml-2 font-mono text-xs text-stone-600">
                    {s.case.birthYear}-{String(s.case.birthMonth).padStart(2, "0")}-
                    {String(s.case.birthDay).padStart(2, "0")}
                  </span>
                  <span className="ml-2">{s.allMatch ? "○" : "×"}</span>
                  <div className="text-xs text-stone-500">
                    {new Date(s.savedAt).toLocaleString("ja-JP")} · {s.romanDisplay}
                  </div>
                </div>
                <button
                  type="button"
                  className="shrink-0 text-xs text-red-700 hover:underline"
                  onClick={() =>
                    persistSaved(saved.filter((x) => x.id !== s.id))
                  }
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
