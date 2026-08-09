/**
 * トップ「記録はこんなふうに育っていきます」セクション用アセット。
 *
 * 差し替え手順：`public/images/home-mock/` 内の同名ファイルを上書きするだけでOK。
 * `imageWidth` / `imageHeight` も実ファイルのピクセル数に合わせて更新すること。
 *
 * 推奨サイズ（目安）：
 * - mock-journal-entry / mock-journal-preview / mock-bookshelf：
 *   幅 **390px 前後以上**（iPhone 12 Pro の論理幅）の縦長フルページスクショ（PNG 推奨）
 * - mock-diary-book：表紙正面・冊子感（背表紙の厚い本に見せない・3:4 前後）
 *
 * 高画質スクショ：`npm run capture:home-mock:auto all`
 */
export const HOME_PRODUCT_MOCK_IMAGES = {
  journalEntry: "/images/home-mock/mock-journal-entry.png",
  journalPreview: "/images/home-mock/mock-journal-preview.png",
  bookshelf: "/images/home-mock/mock-bookshelf.png",
  diaryBook: "/images/home-mock/mock-diary-book.png",
} as const;

export type HomeProductMockFrame = "phone" | "booklet";

export type HomeProductMockStep = {
  stepLabel: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  frame: HomeProductMockFrame;
};

export const HOME_PRODUCT_MOCK_STEPS: HomeProductMockStep[] = [
  {
    stepLabel: "①",
    title: "今日のきもちを残す",
    description: "写真やことばで、その日のきもちを無理なく1日ずつ記録できます。",
    imageSrc: HOME_PRODUCT_MOCK_IMAGES.journalEntry,
    imageAlt: "あしあと入力画面",
    imageWidth: 390,
    imageHeight: 2021,
    frame: "phone",
  },
  {
    stepLabel: "②",
    title: "これまでのあしあとを振り返る",
    description:
      "残したあしあとは、あしあとプレビューで読み返せます。フクロウ先生の言葉も添えられ、その日をやさしく振り返ることができます。",
    imageSrc: HOME_PRODUCT_MOCK_IMAGES.journalPreview,
    imageAlt: "あしあとプレビュー画面",
    imageWidth: 390,
    imageHeight: 1466,
    frame: "phone",
  },
  {
    stepLabel: "③",
    title: "本棚のように並べて読む",
    description: "残したあしあとや鑑定書は、本棚のように並び、あとからまとめて読み返せます。",
    imageSrc: HOME_PRODUCT_MOCK_IMAGES.bookshelf,
    imageAlt: "本棚画面",
    imageWidth: 390,
    imageHeight: 1326,
    frame: "phone",
  },
  {
    stepLabel: "④",
    title: "手元に残る一冊へ",
    description: "デジタルで残した日々が、いつか手元に残る「あしあとブック」へ育っていきます。",
    imageSrc: HOME_PRODUCT_MOCK_IMAGES.diaryBook,
    imageAlt: "製本されたあしあとブック",
    imageWidth: 240,
    imageHeight: 360,
    frame: "booklet",
  },
];
