import Link from "next/link";

const links: { href: string; label: string; note?: string; highlight?: boolean }[] = [
  {
    href: "/preview/pdf-quick",
    label: "PDF サク見（リンクでペコッと表示）",
    note: "npm run dev 中のみ。各ページを左メニューから即プレビュー",
    highlight: true,
  },
  {
    href: "/preview/sample-booklet",
    label: "サンプル冊子 PDF（ブラウザ・ワンクリック）",
    note: "npm run dev 中のみ。初回は 1〜2 分かかることがあります",
  },
  {
    href: "/preview/journal-social-post-image",
    label: "日記・投稿画像（SNS用）",
    note: "ログイン不要。Cursor内ブラウザ用。npm run dev 中のみ",
    highlight: true,
  },
  {
    href: "/preview/journal-social-post-image/layout?template=sns02",
    label: "日記・投稿画像レイアウト定規",
    note: "819×1024 を 1:1 表示。グリッド・座標クリック・配置確認。npm run dev 中のみ",
    highlight: true,
  },
  {
    href: "/preview/journal-local-draft",
    label: "日記オフライン下書き（バナー UI 確認）",
    note: "npm run dev 中のみ。Simple Browser 用。ログイン不要",
    highlight: true,
  },
  {
    href: "/preview/journal-companion-comments",
    label: "日記読み解き（5キャラ・本文切替確認）",
    note: "ログイン不要。伴走キャラごとの読み解き本文を確認。npm run dev 中のみ",
    highlight: true,
  },
  {
    href: "/preview/diary-book-entry",
    label: "日記ブック本文テンプレ（v2・5キャラ切替）",
    note: "レイアウト確認用。読み解き文はサンプル固定。npm run dev 中のみ",
    highlight: true,
  },
  {
    href: "/preview/diary-book-tail",
    label: "日記ブック末尾（早見表・自由記入など）",
    note: "今日のすうじ 早見表を含む製本イメージ。npm run dev 中のみ",
    highlight: true,
  },
  {
    href: "/preview/numerology-numbers?today=8&month=3&year=6",
    label: "すうじの意味辞書（1〜9）",
    note: "カード＋すうじ3つ表示＋1〜9一覧で探す。ログイン不要",
    highlight: true,
  },
  {
    href: "/help/numerology-numbers?today=8&month=3&year=6",
    label: "すうじの意味（本番 /help）",
    note: "デプロイ後と同じURL。npm run dev 中も確認可",
  },
  {
    href: "/preview/pdf-design-map",
    label: "鑑定書アセット：PDF ↔ PNG 対応表",
    note: "デザイン元 PDF をクリックすると本番 PNG を表示（npm run dev 中のみ）",
  },
  {
    href: "/preview/post-atelier",
    label: "BambooNOOK 投稿アトリエ（確認ハブ）",
    note: "今日のこころ予報含む。管理者ログイン後に各画面へ。npm run dev 中のみ",
    highlight: true,
  },
  {
    href: "/preview/post-atelier/daily-number-layout",
    label: "こころ予報・画像レイアウト定規",
    note: "819×1024 を 1:1 表示。グリッド・座標クリック・配置確認。npm run dev 中のみ",
    highlight: true,
  },
  {
    href: "/preview/home-forest-sign/layout?viewport=mobile",
    label: "トップ・森の案内板レイアウト定規",
    note: "485×1024 / 1024×576 を 1:1 表示。看板テキストの座標調整。npm run dev 中のみ",
    highlight: true,
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
          {links.map(({ href, label, note, highlight }) => (
            <li key={href}>
              <Link
                href={href}
                className={[
                  "block rounded-lg border px-4 py-3 text-stone-800 shadow-sm transition",
                  highlight
                    ? "border-emerald-500 bg-emerald-50 hover:border-emerald-600 hover:bg-emerald-100/80"
                    : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50",
                ].join(" ")}
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
