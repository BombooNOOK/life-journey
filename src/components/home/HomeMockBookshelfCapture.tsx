import { BookshelfBookCard } from "@/components/orders/BookshelfBookCard";
import { BookshelfPageHeader } from "@/components/orders/BookshelfPageHeader";
import { diaryCoverImagePath } from "@/lib/journal/coverAssets";

export function HomeMockBookshelfCapture() {
  return (
    <div className="space-y-5">
      <BookshelfPageHeader activeProfileLabel="メイン" />

      <div className="space-y-4">
        <BookshelfBookCard
          id="home-mock-diary-book"
          kind="diary-book"
          title="2026年のあしあとブック"
          periodLabel="2026/01/01 〜 2026/12/31"
          href="/orders/bookshelf/diary-book/demo"
          tone="emerald"
          coverImageSrc={diaryCoverImagePath("kireime", "owl")}
          coverAlt="2026年のあしあとブックの表紙"
          details={[
            { label: "期間", value: "2026/01/01 〜 2026/12/31" },
            { label: "記録数", value: "24件" },
            { label: "表紙", value: "きれいめ" },
            { label: "作成日", value: "2026/6/1" },
            { label: "製本対象", value: "24件の記録（プランは概要で確認）" },
          ]}
          bindingHref="/plans"
          bindingLabel="製本版を注文する"
        />

        <BookshelfBookCard
          id="home-mock-report"
          kind="report"
          title="鑑定書"
          href="/orders/demo/read"
          tone="amber"
          coverImageSrc="/images/kantei-cover.png?v=1"
          coverAlt="鑑定書の表紙"
          readButtonLabel="読む"
          readLoadingLabel="鑑定書を開いています…"
          quickPreviewHref="/orders/demo"
          quickPreviewLabel="鑑定結果を見る"
          quickPreviewHelpText="今日のヒントやコアナンバーの要約ページです。"
          bindingHref="/orders/demo/book-binding"
          bindingLabel="製本版を注文する"
          details={[
            { label: "お名前", value: "あなた" },
            { label: "作成日", value: "2026/4/21" },
            { label: "PDF形式", value: "目次リンクつき軽量PDF（アプリ内ビューア対応）" },
            { label: "ダウンロード", value: "ダウンロード残り 3 / 3 回" },
          ]}
        />
      </div>
    </div>
  );
}
