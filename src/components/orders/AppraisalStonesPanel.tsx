import type { AppraisalStoneSelection } from "@/lib/stones/types";

interface Props {
  stones: AppraisalStoneSelection;
  /** 入力の関心テーマ（候補内の優先付けに使用） */
  stoneFocusTheme?: string;
}

export function AppraisalStonesPanel({ stones, stoneFocusTheme }: Props) {
  return (
    <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-stone-900">守護石（鑑定書再現）</h2>
        <p className="mt-1 text-xs text-stone-600">
          LP / D / S / P / BD の5つだけを表示します（お守り石ロジックは分離）。
        </p>
        {stoneFocusTheme ? (
          <p className="mt-2 text-xs text-stone-700">
            関心テーマ: <span className="font-medium">{stoneFocusTheme}</span>
          </p>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-stone-600">
              <th className="py-2 pr-2">コア</th>
              <th className="py-2 pr-2">ナンバー</th>
              <th className="py-2 pr-2">色分類</th>
              <th className="py-2 pr-2">候補石</th>
              <th className="py-2 pr-2">採用石</th>
              <th className="py-2 pr-2">キーワード</th>
              <th className="py-2">選定理由</th>
            </tr>
          </thead>
          <tbody>
            {stones.items.map((item) => (
              <tr key={item.key} className="border-b border-stone-100 align-top">
                <td className="py-2 pr-2 font-medium text-stone-800">{item.label}</td>
                <td className="py-2 pr-2 font-mono text-stone-900">{item.number ?? "—"}</td>
                <td className="py-2 pr-2 text-stone-800">{item.color}</td>
                <td className="py-2 pr-2 text-stone-700">
                  {item.candidates.map((c) => c.nameJa).join("、") || "（候補なし）"}
                </td>
                <td className="py-2 pr-2 text-stone-900">{item.selected?.nameJa ?? "（未選定）"}</td>
                <td className="py-2 pr-2 text-stone-700">{item.keywords.join("・") || "—"}</td>
                <td className="py-2 text-stone-700">{item.reason}</td>
              </tr>
            ))}
            {stones.items.some((i) => i.stonePdfBody) ? (
              <>
                <tr className="border-b border-stone-100">
                  <td colSpan={7} className="py-2 text-xs font-medium text-stone-600">
                    鑑定書用 PDF 本文（採用石）
                  </td>
                </tr>
                {stones.items.map((item) => (
                  <tr key={`${item.key}-body`} className="border-b border-stone-100 align-top">
                    <td className="py-2 pr-2 font-medium text-stone-800">{item.label}</td>
                    <td colSpan={6} className="py-2 text-xs text-stone-700">
                      {item.stonePdfBody ? (
                        <details className="rounded border border-stone-100 bg-stone-50/80 p-2">
                          <summary className="cursor-pointer text-stone-600">
                            {item.selected?.nameJa ?? "—"} の本文を表示
                          </summary>
                          <div className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap">
                            <p className="font-medium text-stone-800">石の特徴</p>
                            <p className="mt-1">{item.stonePdfBody.featureText}</p>
                            <p className="mt-3 font-medium text-stone-800">石のパワー</p>
                            <p className="mt-1">{item.stonePdfBody.powerText}</p>
                          </div>
                        </details>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
