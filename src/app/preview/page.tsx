import Link from "next/link";

const links: { href: string; label: string; note?: string }[] = [
  {
    href: "/preview/sample-booklet",
    label: "サンプル冊子 PDF（ブラウザ・ワンクリック）",
    note: "npm run dev 中のみ。初回は 1〜2 分かかることがあります",
  },
  { href: "/verify", label: "数値の突合（コア5・ローマ字）", note: "旧鑑定書・Excel との照合用" },
  { href: "/preview/all-bodies", label: "鑑定本文まとめ（全データ・1ページ）", note: "LP〜ブリッジ・PY/PM/PD まで一括" },
  {
    href: "/preview/bridge-comments",
    label: "ブリッジ一致度コメント一覧",
    note: "章ごとの参照表＋ pairKey ごとの scoreLabel（短文のみ）",
  },
  { href: "/preview/life-path-rewrite", label: "ライフパス（章ごとテキスト）" },
  { href: "/preview/destiny-pdf?destiny=1", label: "ディスティニー PDF 単体（D1〜D33）" },
  { href: "/preview/soul-pdf?soul=1", label: "ソウル PDF 単体（S1〜S33）", note: "npm run dev 中のみ" },
  {
    href: "/preview/personality-pdf?personality=1",
    label: "パーソナリティ PDF 単体（P1〜P33）",
    note: "npm run dev 中のみ",
  },
  {
    href: "/preview/birthday-pdf?birthday=1",
    label: "バースデー PDF 単体（B1〜B22）",
    note: "npm run dev 中のみ",
  },
  { href: "/preview/destiny-rewrite", label: "ディスティニー" },
  { href: "/preview/soul-rewrite", label: "ソウル" },
  { href: "/preview/personality-rewrite", label: "パーソナリティ" },
  { href: "/preview/birthday-rewrite", label: "バースデー" },
  { href: "/preview/maturity-rewrite", label: "マチュリティ" },
];

export default function PreviewMenuPage() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-xl font-semibold text-stone-800">校正・確認用メニュー</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          原稿データの一覧表示や、計算結果の確認用です。本番のお客様向け導線には含まれていません。
        </p>
        <ul className="mt-8 space-y-3">
          {links.map(({ href, label, note }) => (
            <li key={href}>
              <Link
                href={href}
                className="block rounded-lg border border-stone-200 bg-white px-4 py-3 text-stone-800 shadow-sm transition hover:border-stone-300 hover:bg-stone-50"
              >
                <span className="font-medium">{label}</span>
                {note ? <span className="mt-1 block text-xs text-stone-500">{note}</span> : null}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-xs text-stone-500">
          全文をファイルに出す場合は{" "}
          <code className="rounded bg-stone-200 px-1 text-stone-700">npm run dump:bodies</code>（
          <code className="rounded bg-stone-200 px-1 text-stone-700">numerology-body-dump.txt</code>
          ）。ブリッジ短文だけは{" "}
          <code className="rounded bg-stone-200 px-1 text-stone-700">npm run dump:bridge-comments</code>（
          <code className="rounded bg-stone-200 px-1 text-stone-700">bridge-score-comments-dump.txt</code>）。
        </p>
        <p className="mt-4">
          <Link href="/" className="text-sm text-stone-600 underline hover:text-stone-900">
            ← トップへ
          </Link>
        </p>
      </div>
    </div>
  );
}
