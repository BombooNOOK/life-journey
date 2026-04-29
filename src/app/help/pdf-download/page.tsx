import Link from "next/link";

export const dynamic = "force-static";

function StepCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      <div className="mt-2 space-y-2 text-sm leading-6 text-stone-700">{children}</div>
    </div>
  );
}

function Diagram({
  lines,
}: {
  lines: string[];
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-xs leading-5 text-stone-700">
      {lines.map((line, idx) => (
        <p key={idx} className="font-mono">
          {line}
        </p>
      ))}
    </div>
  );
}

export default function PdfDownloadHelpPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Link href="/orders/bookshelf" className="text-sm text-stone-600 hover:text-stone-900">
          ← 本棚へ戻る
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">鑑定書PDFのダウンロード方法</h1>
        <p className="mt-1 text-sm text-stone-600">
          端末ごとに保存方法が少し違います。下の手順どおりに進めれば、PDFを端末へ保存できます。
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-stone-900">PC（Mac / Windows）</h2>
        <StepCard title="1. 本棚または概要ページで『鑑定書PDFをダウンロード』をクリック">
          <Diagram
            lines={[
              "[本棚カード]",
              "  └─ 鑑定書PDFをダウンロード  ← ここをクリック",
            ]}
          />
        </StepCard>
        <StepCard title="2. PDFが開いたら保存ボタンを押す">
          <p>ブラウザ上部か右上にある保存アイコン（↓ または 💾）を押してください。</p>
          <Diagram
            lines={[
              "[PDFビューア右上]",
              "  印刷  ダウンロード(↓)  その他(...)",
            ]}
          />
        </StepCard>
        <StepCard title="3. 保存先を選んで完了">
          <p>おすすめは「ダウンロード」フォルダです。あとで探しやすくなります。</p>
        </StepCard>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-stone-900">スマホ（iPhone / Android）</h2>
        <StepCard title="1. 『鑑定書PDFをダウンロード』をタップ">
          <p>表示に時間がかかることがあるため、画面を閉じずに待ってください。</p>
        </StepCard>
        <StepCard title="2. 共有ボタンから保存">
          <p>iPhone はSafari下部の共有（□↑）、Android は共有（↗）またはダウンロード（↓）を使います。</p>
          <Diagram
            lines={[
              "[iPhone Safari 下部]",
              "  戻る 進む 共有(□↑) ブックマーク タブ",
              "",
              "[Android Chrome 上部/下部]",
              "  ... 共有(↗) ダウンロード(↓)",
            ]}
          />
        </StepCard>
        <StepCard title="3. 『ファイルに保存』または『ダウンロード』を選ぶ">
          <p>
            iPhone は「ファイルに保存」、Android は「ダウンロード」または「Driveに保存」を選ぶと確実です。
          </p>
        </StepCard>
      </section>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-900">
        <p className="font-semibold">注意</p>
        <p>
          無料ダウンロード回数は『ダウンロード操作』で消費されます。ページ内表示のみ（プレビュー）とは別です。
        </p>
      </div>
    </div>
  );
}

