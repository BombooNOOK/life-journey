/**
 * トップ「記録はこんなふうに育っていきます。」セクション用アセット。
 *
 * 差し替え手順：`public/images/home-mock/` 内の同名ファイルを上書きするだけでOK。
 *
 * 推奨サイズ（目安）：
 * - mock-journal-entry：幅 750〜1170px、縦長（スマホスクショ 9:19 前後）
 * - mock-bookshelf：同上
 * - mock-diary-book-placeholder：表紙正面・冊子感（背表紙の厚い本に見せない・3:4 前後）
 */
export const HOME_PRODUCT_MOCK_IMAGES = {
  journalEntry: "/images/home-mock/mock-journal-entry.png",
  bookshelf: "/images/home-mock/mock-bookshelf.png",
  diaryBookPlaceholder: "/images/home-mock/mock-diary-book-placeholder.png",
} as const;

export type HomeProductMockFrame = "phone" | "booklet";

export type HomeProductMockStep = {
  stepLabel: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  frame: HomeProductMockFrame;
};

export const HOME_PRODUCT_MOCK_STEPS: HomeProductMockStep[] = [
  {
    stepLabel: "①",
    title: "今日のきもちを残す",
    description: "写真やことば、その日のきもちを、無理なく1日ずつ記録できます。",
    imageSrc: HOME_PRODUCT_MOCK_IMAGES.journalEntry,
    imageAlt: "日記入力画面",
    frame: "phone",
  },
  {
    stepLabel: "②",
    title: "あとから読み返す",
    description: "書いた日記や鑑定書は、本棚のように並び、あとからやさしく読み返せます。",
    imageSrc: HOME_PRODUCT_MOCK_IMAGES.bookshelf,
    imageAlt: "本棚画面",
    frame: "phone",
  },
  {
    stepLabel: "③",
    title: "手元に残る一冊へ",
    description: "デジタルで残した日々が、いつか手元に残る「日記ブック」へ育っていきます。",
    imageSrc: HOME_PRODUCT_MOCK_IMAGES.diaryBookPlaceholder,
    imageAlt: "日記ブック表紙のイメージ（実物写真差し替え予定）",
    frame: "booklet",
  },
];
