"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { ExpectedCoreFivePartial } from "@/lib/verification/coreFive";

type NullableKey = "destinyNumber" | "soulNumber" | "personalityNumber";

const FIELDS: {
  key: keyof ExpectedCoreFivePartial;
  label: string;
  allowExplicitNull: boolean;
}[] = [
  { key: "lifePathNumber", label: "ライフ・パス", allowExplicitNull: false },
  { key: "destinyNumber", label: "ディスティニー", allowExplicitNull: true },
  { key: "soulNumber", label: "ソウル", allowExplicitNull: true },
  { key: "personalityNumber", label: "パーソナリティ", allowExplicitNull: true },
  { key: "birthdayNumber", label: "バースデー", allowExplicitNull: false },
];

interface Props {
  orderId: string;
  initialExpected: ExpectedCoreFivePartial | null;
}

export function ExpectedVerificationForm({ orderId, initialExpected }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [text, setText] = useState(() => {
    const e = initialExpected ?? {};
    return FIELDS.map(({ key, allowExplicitNull }) => {
      if (!Object.prototype.hasOwnProperty.call(e, key)) return "";
      const v = e[key];
      if (v === null && allowExplicitNull) return "";
      if (v === null) return "";
      return String(v);
    });
  });

  const [expectNull, setExpectNull] = useState<Record<NullableKey, boolean>>(() => ({
    destinyNumber:
      initialExpected != null &&
      Object.prototype.hasOwnProperty.call(initialExpected, "destinyNumber") &&
      initialExpected.destinyNumber === null,
    soulNumber:
      initialExpected != null &&
      Object.prototype.hasOwnProperty.call(initialExpected, "soulNumber") &&
      initialExpected.soulNumber === null,
    personalityNumber:
      initialExpected != null &&
      Object.prototype.hasOwnProperty.call(initialExpected, "personalityNumber") &&
      initialExpected.personalityNumber === null,
  }));

  const parsed = useMemo((): ExpectedCoreFivePartial | null => {
    const out: ExpectedCoreFivePartial = {};
    FIELDS.forEach(({ key, allowExplicitNull }, i) => {
      const raw = text[i]?.trim() ?? "";
      if (allowExplicitNull && expectNull[key as NullableKey]) {
        if (key === "destinyNumber") out.destinyNumber = null;
        else if (key === "soulNumber") out.soulNumber = null;
        else if (key === "personalityNumber") out.personalityNumber = null;
        return;
      }
      if (!raw) return;
      const n = Number(raw);
      if (!Number.isInteger(n)) {
        throw new Error(`${key} は整数で入力するか空欄にしてください`);
      }
      out[key] = n;
    });
    return Object.keys(out).length ? out : null;
  }, [text, expectNull]);

  async function save() {
    setError(null);
    let body: ExpectedCoreFivePartial | null;
    try {
      body = parsed;
    } catch (e) {
      setError(e instanceof Error ? e.message : "入力が不正です");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/expected`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expected: body }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "保存に失敗しました");
        return;
      }
      router.refresh();
    } catch {
      setError("通信に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function clearExpected() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/expected`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expected: null }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "クリアに失敗しました");
        return;
      }
      setText(FIELDS.map(() => ""));
      setExpectNull({
        destinyNumber: false,
        soulNumber: false,
        personalityNumber: false,
      });
      router.refresh();
    } catch {
      setError("通信に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-sm">
      <h3 className="font-semibold text-stone-900">検証用・期待値（旧Excelなど）</h3>
      <p className="mt-1 text-xs text-stone-600">
        比較したい項目だけ数字を入れて保存してください。空欄の項目は比較しません。名前由来が「—」のときは「—（算出なし）を期待」にチェックを入れてください。
      </p>
      <div className="mt-3 space-y-3">
        {FIELDS.map(({ key, label, allowExplicitNull }, i) => (
          <div key={key} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <label className="w-40 shrink-0 text-stone-700">{label}</label>
            <input
              type="text"
              inputMode="numeric"
              className="w-28 rounded border border-stone-300 px-2 py-1 disabled:bg-stone-100"
              value={text[i]}
              onChange={(e) => {
                const next = [...text];
                next[i] = e.target.value;
                setText(next);
              }}
              disabled={allowExplicitNull && expectNull[key as NullableKey]}
              placeholder="空欄で比較しない"
            />
            {allowExplicitNull ? (
              <label className="flex items-center gap-1 text-xs text-stone-600">
                <input
                  type="checkbox"
                  checked={expectNull[key as NullableKey]}
                  onChange={(e) => {
                    setExpectNull((prev) => ({
                      ...prev,
                      [key]: e.target.checked,
                    }));
                  }}
                />
                —（算出なし）を期待
              </label>
            ) : null}
          </div>
        ))}
      </div>
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => void save()}
          className="rounded-lg bg-stone-800 px-4 py-2 text-xs font-medium text-white hover:bg-stone-700 disabled:opacity-50"
        >
          {loading ? "保存中…" : "期待値を保存"}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => void clearExpected()}
          className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-xs text-stone-800 hover:bg-stone-50 disabled:opacity-50"
        >
          期待値をクリア
        </button>
      </div>
    </div>
  );
}
