import type { NumerologyResult } from "@/lib/numerology/types";
import {
  getStoneSelectionNumerologySlice,
  stoneDriftHints,
  stoneSelectionsEquivalent,
} from "@/lib/stones/fromNumerology";
import type { StoneSelection } from "@/lib/stones/types";

export interface StonesComparisonPanelProps {
  numerologyAtSave: NumerologyResult | null;
  numerologyCurrent: NumerologyResult | null;
  stonesStored: StoneSelection | null;
  stonesRecalculated: StoneSelection | null;
  /** 再計算が例外で失敗したときのメッセージ（ページ全体は表示し続ける） */
  stonesRecalculateError?: string | null;
}

function fmtCore(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return String(n);
}

function alternateLine(label: string, stones: StoneSelection, key: "mainAlternates" | "charmAlternates") {
  const list = stones[key];
  if (!list.length) return null;
  return (
    <p className="mt-1 text-xs text-stone-500">
      {label}: {list.map((s) => s.nameJa).join("、")}
    </p>
  );
}

export function StonesComparisonPanel({
  numerologyAtSave,
  numerologyCurrent,
  stonesStored,
  stonesRecalculated,
  stonesRecalculateError,
}: StonesComparisonPanelProps) {
  const hints = stoneDriftHints({
    numerologyAtSave,
    numerologyCurrent,
    stonesStored,
    stonesRecalculated,
  });

  const sliceSave = numerologyAtSave ? getStoneSelectionNumerologySlice(numerologyAtSave) : null;
  const sliceNow = numerologyCurrent ? getStoneSelectionNumerologySlice(numerologyCurrent) : null;

  const mainMatch =
    stonesStored && stonesRecalculated
      ? stonesStored.mainStone.id === stonesRecalculated.mainStone.id
      : null;
  const charmMatch =
    stonesStored && stonesRecalculated
      ? stonesStored.charmStone.id === stonesRecalculated.charmStone.id
      : null;
  const bothMatch =
    stonesStored && stonesRecalculated ? stoneSelectionsEquivalent(stonesStored, stonesRecalculated) : null;

  return (
    <div className="space-y-5 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">守護石（保存値と再計算の比較）</h2>
        <p className="mt-1 text-xs text-stone-600">
          保存されている <code className="rounded bg-stone-100 px-1">stonesJson</code> と、
          いまの数秘（LP・BD などを補正した値）から <strong>表示だけ</strong>{" "}
          選び直した結果を並べています。DB はまだ更新しません。
        </p>
      </div>

      <p className="text-xs text-stone-500">
        LP が変わると候補リストが切り替わります。BD・D/S/P が変わると同じリスト内のスコアが変わります（ブリッジは未使用）。
      </p>

      <section>
        <h3 className="text-sm font-semibold text-stone-800">選定に使う数値（比較）</h3>
        <p className="mt-1 text-xs text-stone-500">
          左は注文時に保存した <code className="rounded bg-stone-100 px-1">numerologyJson</code>
          、右は画面表示と同じ補正後の数秘です。
        </p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[320px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-stone-600">
                <th className="py-2 pr-2">項目</th>
                <th className="py-2 pr-2">注文保存時（JSON）</th>
                <th className="py-2">現在（補正後）</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["ライフ・パス", "lifePathNumber"],
                  ["バースデー", "birthdayNumber"],
                  ["ディスティニー", "destinyNumber"],
                  ["ソウル", "soulNumber"],
                  ["パーソナリティ", "personalityNumber"],
                ] as const
              ).map(([label, key]) => (
                <tr key={key} className="border-b border-stone-100">
                  <td className="py-2 pr-2 text-stone-700">{label}</td>
                  <td className="py-2 pr-2 font-mono text-stone-900">
                    {sliceSave ? fmtCore(sliceSave[key]) : "—"}
                  </td>
                  <td className="py-2 font-mono text-stone-900">
                    {sliceNow ? fmtCore(sliceNow[key]) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-stone-800">守護石の結果</h3>
        {stonesRecalculateError ? (
          <p
            role="alert"
            className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            再計算エラー: {stonesRecalculateError}
          </p>
        ) : null}
        {!stonesStored ? (
          <p className="mt-2 text-sm text-amber-800">保存された守護石データを読み取れませんでした。</p>
        ) : null}
        {!stonesRecalculated ? (
          <p className="mt-2 text-sm text-amber-800">数秘が取得できないため、再計算できません。</p>
        ) : null}
        {stonesStored && stonesRecalculated ? (
          <>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[320px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-left text-stone-600">
                    <th className="py-2 pr-2">種別</th>
                    <th className="py-2 pr-2">保存（注文時）</th>
                    <th className="py-2 pr-2">再計算（現在の数値）</th>
                    <th className="py-2">一致</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-stone-100">
                    <td className="py-2 pr-2 text-stone-700">メイン守護石</td>
                    <td className="py-2 pr-2">
                      <span className="font-medium text-stone-900">{stonesStored.mainStone.nameJa}</span>
                      <span className="ml-2 font-mono text-xs text-stone-500">{stonesStored.mainStone.id}</span>
                    </td>
                    <td className="py-2 pr-2">
                      <span className="font-medium text-stone-900">
                        {stonesRecalculated.mainStone.nameJa}
                      </span>
                      <span className="ml-2 font-mono text-xs text-stone-500">
                        {stonesRecalculated.mainStone.id}
                      </span>
                    </td>
                    <td className="py-2 text-lg">{mainMatch ? "○" : "×"}</td>
                  </tr>
                  <tr className="border-b border-stone-100">
                    <td className="py-2 pr-2 text-stone-700">お守り石</td>
                    <td className="py-2 pr-2">
                      <span className="font-medium text-stone-900">{stonesStored.charmStone.nameJa}</span>
                      <span className="ml-2 font-mono text-xs text-stone-500">{stonesStored.charmStone.id}</span>
                    </td>
                    <td className="py-2 pr-2">
                      <span className="font-medium text-stone-900">
                        {stonesRecalculated.charmStone.nameJa}
                      </span>
                      <span className="ml-2 font-mono text-xs text-stone-500">
                        {stonesRecalculated.charmStone.id}
                      </span>
                    </td>
                    <td className="py-2 text-lg">{charmMatch ? "○" : "×"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {bothMatch === false ? (
              <p className="mt-2 text-sm font-medium text-amber-900">
                メインまたはお守りが保存時と異なります。PDF はまだ保存時の内容のままです。
              </p>
            ) : bothMatch === true ? (
              <p className="mt-2 text-sm text-emerald-800">メイン・お守りとも id が一致しています。</p>
            ) : null}
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div className="rounded-md border border-stone-100 bg-stone-50/80 p-3 text-xs">
                <p className="font-medium text-stone-800">保存時のサブ候補</p>
                {alternateLine("メイン同点帯", stonesStored, "mainAlternates")}
                {alternateLine("お守り同点帯", stonesStored, "charmAlternates")}
              </div>
              <div className="rounded-md border border-stone-100 bg-stone-50/80 p-3 text-xs">
                <p className="font-medium text-stone-800">再計算のサブ候補</p>
                {alternateLine("メイン同点帯", stonesRecalculated, "mainAlternates")}
                {alternateLine("お守り同点帯", stonesRecalculated, "charmAlternates")}
              </div>
            </div>
            {stonesRecalculated.rationale.length > 0 ? (
              <div className="mt-3 text-xs text-stone-500">
                <p className="font-medium text-stone-600">再計算ロジックのメモ</p>
                <ul className="mt-1 list-inside list-disc">
                  {stonesRecalculated.rationale.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : null}
      </section>

      {hints.length > 0 ? (
        <section className="rounded-lg border border-stone-200 bg-stone-50 p-4">
          <h3 className="text-sm font-semibold text-stone-800">この注文についてのヒント</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-stone-700">
            {hints.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
