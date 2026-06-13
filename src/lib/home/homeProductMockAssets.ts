/**
 * トップ「記録はこんなふうに育っていきます」セクション用アセット。
 *
 * 差し替え手順：`public/images/home-mock/` 内の同名ファイルを上書きするだけでOK。
 * `imageWidth` / `imageHeight` も実ファイルのピクセル数に合わせて更新すること。
 *
 * 推奨サイズ（目安）：
 * - mock-journal-entry / mock-bookshelf：
 *   幅 **390px 前後以上**（iPhone 12 Pro の論理幅）の縦長フルページスクショ（PNG 推奨）
 *   ※ 幅 200〜300px だとモック表示時にボケやすい
 * - mock-diary-book-placeholder：表紙正面・冊子感（背表紙の厚い本に見せない・3:4 前後）
 *
 * 高画質スクショの撮り方（Mac + Chrome 推奨）：
 * 1. DevTools を開く → デバイスモード ON（iPhone 12 Pro）
 * 2. 上部バーで **Dimensions: 390 × 844**、**Zoom: 100%** を確認
 * 3. DevTools は画面右または下に寄せ、ページ表示域を狭めすぎない
 * 4. 対象ページを表示 → Cmd+Shift+P → "Capture full size screenshot"
 * 5. 保存後、画像の幅が 390px 前後か確認してから上書き
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
  imageWidth: number;
  imageHeight: number;
  frame: HomeProductMockFrame;
};

export const HOME_PRODUCT_MOCK_STEPS: HomeProductMockStep[] = [
  {
    stepLabel: "①",
    title: "今日のきもちを残す",
    description: "写真やことば、その日のきもちを、無理なく1日ずつ記録できます。",
    imageSrc: HOME_PRODUCT_MOCK_IMAGES.journalEntry,
    imageAlt: "日記入力画面",
    imageWidth: 390,
    imageHeight: 2088,
    frame: "phone",
  },
  {
    stepLabel: "②",
    title: "あとから読み返す",
    description: "書いた日記や鑑定書は、本棚のように並び、あとからやさしく読み返せます。",
    imageSrc: HOME_PRODUCT_MOCK_IMAGES.bookshelf,
    imageAlt: "本棚画面",
    imageWidth: 390,
    imageHeight: 1252,
    frame: "phone",
  },
  {
    stepLabel: "③",
    title: "手元に残る一冊へ",
    description: "デジタルで残した日々が、いつか手元に残る「日記ブック」へ育っていきます。",
    imageSrc: HOME_PRODUCT_MOCK_IMAGES.diaryBookPlaceholder,
    imageAlt: "日記ブック表紙のイメージ（実物写真差し替え予定）",
    imageWidth: 200,
    imageHeight: 300,
    frame: "booklet",
  },
];
