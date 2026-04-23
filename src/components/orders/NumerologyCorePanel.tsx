import { numerologyWithRefreshedLifePath } from "@/lib/order/numerologyDisplay";
import type { NumerologyResult } from "@/lib/numerology/types";
import {
  CORE_FIVE_KEYS,
  compareCoreFive,
  labelForCoreKey,
  parseExpectedJson,
  snapshotFromNumerology,
} from "@/lib/verification/coreFive";

import { ExpectedVerificationForm } from "./ExpectedVerificationForm";

interface OrderSlice {
  id: string;
  numerologyJson: string;
  birthDate: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  expectedNumerologyJson: string | null;
}

export function NumerologyCorePanel({ order }: { order: OrderSlice }) {
  const numerology: NumerologyResult | null = numerologyWithRefreshedLifePath(
    order.numerologyJson,
    order.birthDate,
    {
      birthYear: order.birthYear,
      birthMonth: order.birthMonth,
      birthDay: order.birthDay,
    },
  );

  if (!numerology) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        数秘データの読み込みに失敗しました。
      </div>
    );
  }

  const snap = snapshotFromNumerology(numerology);
  const expected = parseExpectedJson(order.expectedNumerologyJson);
  const hasExpected = Boolean(expected && Object.keys(expected).length > 0);
  let rows: ReturnType<typeof compareCoreFive>["rows"] | null = null;
  let allComparedMatch = false;
  if (hasExpected && expected) {
    try {
      const r = compareCoreFive(snap, expected);
      rows = r.rows;
      allComparedMatch = r.allComparedMatch;
    } catch {
      rows = null;
      allComparedMatch = false;
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">数秘（コア5項目）— 突合用</h2>
        <p className="mt-1 text-xs text-stone-600">
          旧Excelや完成鑑定書の数字と、ここに出る「このアプリの結果」を並べて比較してください。
        </p>

        {hasExpected && rows ? (
          <p className="mt-2 text-sm">
            <span className="font-medium">比較結果: </span>
            {allComparedMatch ? (
              <span className="text-emerald-700">入力した項目はすべて一致しました</span>
            ) : (
              <span className="text-amber-800">入力した項目のうち、どこかが一致しません（下表を確認）</span>
            )}
          </p>
        ) : (
          <p className="mt-2 text-xs text-stone-500">
            期待値をまだ入れていません。下の「検証用・期待値」に旧データを入力すると、一致／不一致が表示されます。
          </p>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[320px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-stone-600">
                <th className="py-2 pr-2">項目</th>
                <th className="py-2 pr-2">このアプリ</th>
                {hasExpected ? (
                  <>
                    <th className="py-2 pr-2">期待値（旧データ）</th>
                    <th className="py-2">一致</th>
                  </>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {hasExpected && rows
                ? rows.map((row) => (
                    <tr key={row.key} className="border-b border-stone-100">
                      <td className="py-2 pr-2 text-stone-700">{row.label}</td>
                      <td className="py-2 pr-2 font-medium text-stone-900">
                        {row.actual === null || row.actual === undefined ? "—" : row.actual}
                      </td>
                      <td className="py-2 pr-2 text-stone-800">
                        {row.status === "skipped"
                          ? "（比較なし）"
                          : row.expected === null
                            ? "—"
                            : row.expected}
                      </td>
                      <td className="py-2">
                        {row.status === "skipped" ? "—" : row.status === "match" ? "○" : "×"}
                      </td>
                    </tr>
                  ))
                : CORE_FIVE_KEYS.map((key) => (
                    <tr key={key} className="border-b border-stone-100">
                      <td className="py-2 pr-2 text-stone-700">{labelForCoreKey(key)}</td>
                      <td className="py-2 pr-2 font-medium text-stone-900">
                        {snap[key] === null || snap[key] === undefined ? "—" : snap[key]}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      <ExpectedVerificationForm
        key={order.expectedNumerologyJson ?? "none"}
        orderId={order.id}
        initialExpected={expected}
      />
    </div>
  );
}
