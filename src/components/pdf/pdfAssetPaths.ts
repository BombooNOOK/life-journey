/**
 * PDF 用の画像パス（サーバー側 `renderToBuffer` / API と同じ cwd 前提）。
 *
 * - はじめに 1P / 2P: `introduction-page-1.png` / `introduction-page-2.png`（全面画像・`IntroductionPages`）
 * - 表紙の次・中表紙（扉絵）: `inside-cover-page.png`（`InsideCoverPage`）
 * - 表紙: `cover-template.png`（`CoverPage`・元 `cover-template.pdf` から長辺2480px相当でラスタ化）
 * - 「ライフパスナンバーとは」: `life-path-guide.png`（`LifePathGuidePage`・全面）
 * - 「ディスティニーナンバーとは」: `destiny-guide.png`（`DestinyGuidePage`・全面）
 * - 「ソウルナンバーとは」: `soul-guide.png`（`SoulGuidePage`・全面）
 * - ディスティニー本文1枚目: `destiny-first-page.png`（`DestinyPage`・ライフパスと同様に1枚目のみ全面）
 * - ソウル本文1枚目: `soul-first-page.png`（`SoulPage`・1枚目のみ全面）
 * - 「パーソナリティナンバーとは」: `personality-guide.png`（`PersonalityGuidePage`・全面）
 * - パーソナリティ本文1枚目: `personality-first-page.png`（`PersonalityPage`・1P 全面＋2P 以降に本文）
 * - 「バースデーナンバーとは」: `birthday-guide.png`（`BirthdayGuidePage`・全面）
 * - バースデー本文1枚目: `birthday-first-page.png`（`BirthdayPage`・1枚目のみ全面）
 * - 「マチュリティナンバーとは」: `maturity-guide.png`（`MaturityGuidePage`・全面）
 * - マチュリティ本文1枚目: `maturity-first-page.png`（`MaturityPage`・1枚目のみ全面・元 `haikei_m2.pdf`）
 * - パーソナルイヤー導入2P: `personal-year-message.png` / `personal-year-guide.png`
 *   （`PersonalYearIntroPages`）
 * - 見開き本文: 左ページ用 / 右ページ用（3P以降の奇偶。2Pは本文1P＝右用）
 * - 裏表紙: 最終ページ
 *
 * 差し替えは各 PNG を同パスで上書きするか、このファイルのパスを変更してください。
 *
 * 解像度：大型表示・製本を想定する全面背景は A5 長辺でおおよそ 1700px 級（300dpi 帯）が目安。
 * 低解像度のままの画像は差し替え時に高解像度版を推奨（詳細は `.cursor/rules/numerology-pdf-booklet.mdc`）。
 */
import { fileURLToPath } from "node:url";

function pdfAssetPath(fileName: string): string {
  // `process.cwd()` に依存しないよう、ファイル自身の場所から相対パスで解決する
  return fileURLToPath(new URL(`./assets/${fileName}`, import.meta.url));
}
/** はじめに 1ページ目（文案は画像内。差し替え時は同パスで上書き） */
export const PDF_INTRODUCTION_PAGE_1_PATH = `${process.cwd()}/src/components/pdf/assets/introduction-page-1.png`;

/** はじめに 2ページ目「このガイドの案内人」（全面画像） */
export const PDF_INTRODUCTION_PAGE_2_PATH = `${process.cwd()}/src/components/pdf/assets/introduction-page-2.png`;

/** 表紙直後の中表紙（扉絵・全面画像） */
export const PDF_INSIDE_COVER_PAGE_PATH = `${process.cwd()}/src/components/pdf/assets/inside-cover-page.png`;

export const PDF_COVER_IMAGE_PATH = `${process.cwd()}/src/components/pdf/assets/cover-template.png`;

/** 「ライフパスナンバーとは」ガイド1ページ（デザインPDF由来の全面画像） */
export const PDF_LIFE_PATH_GUIDE_PAGE_PATH = `${process.cwd()}/src/components/pdf/assets/life-path-guide.png`;

/** 見開きの左ページ用（PDF の奇数ページ・3P以降） */
export const PDF_SPREAD_LEFT_PATH = `${process.cwd()}/src/components/pdf/assets/spread-left.png`;

/** 見開きの右ページ用（PDF の偶数ページ・2P本文1Pもここ） */
export const PDF_SPREAD_RIGHT_PATH = `${process.cwd()}/src/components/pdf/assets/spread-right.png`;

/** 最終ページ・裏表紙 */
export const PDF_BACK_COVER_PATH = `${process.cwd()}/src/components/pdf/assets/back-cover.png`;

/**
 * ライフパス1枚目のみ（全面ラスタ）。デザイン元は `haikei-lp2.pdf`。
 * PNG を差し替えたあと、帯ヘッダーが隠れる場合は `npm run fix:lp-bg-header`（上端の明地を透明化）。
 * 見出し縦位置は `pdfStyles.lifePathNumberFirstPageHero`。
 */
export const PDF_LIFE_PATH_FIRST_PAGE_PATH = `${process.cwd()}/src/components/pdf/assets/haikei-lp.png`;

/** 「ディスティニーナンバーとは」ガイド1ページ（全面画像） */
export const PDF_DESTINY_GUIDE_PAGE_PATH = `${process.cwd()}/src/components/pdf/assets/destiny-guide.png`;

/**
 * ディスティニー本文1枚目のみ（装飾入り背景。2枚目以降は白地）。デザイン元は `haikei_d2.pdf`。
 * PNG 差し替え後に帯ヘッダーが隠れる場合は `npm run fix:destiny-bg-header`。見出し位置は `destinyNumberFirstPageHero`。
 */
export const PDF_DESTINY_FIRST_PAGE_PATH = `${process.cwd()}/src/components/pdf/assets/destiny-first-page.png`;

/** 「ソウルナンバーとは」ガイド1ページ（全面画像） */
export const PDF_SOUL_GUIDE_PAGE_PATH = `${process.cwd()}/src/components/pdf/assets/soul-guide.png`;

/**
 * ソウル本文1枚目のみ（装飾入り背景。2枚目以降は白地）。`SoulPage` はディスティニー同様、1P ヒーロー＋2P 以降に本文。
 * デザイン元は `haikei_s2.pdf`。PNG 差し替え後は `npm run fix:soul-bg-header`。見出し位置は `soulNumberFirstPageHero`。
 */
export const PDF_SOUL_FIRST_PAGE_PATH = `${process.cwd()}/src/components/pdf/assets/soul-first-page.png`;

/** 「パーソナリティナンバーとは」ガイド1ページ（全面画像） */
export const PDF_PERSONALITY_GUIDE_PAGE_PATH = `${process.cwd()}/src/components/pdf/assets/personality-guide.png`;

/**
 * パーソナリティ本文1枚目のみ（装飾入り背景。2枚目以降は白地）。`PersonalityPage` はディスティニー同様、1P ヒーロー＋2P 以降に本文。
 * デザイン元は `haikei_p2.pdf`。PNG 差し替え後は `npm run fix:personality-bg-header`。見出し位置は `personalityNumberFirstPageHero`。
 */
export const PDF_PERSONALITY_FIRST_PAGE_PATH = `${process.cwd()}/src/components/pdf/assets/personality-first-page.png`;

/** 「バースデーナンバーとは」ガイド1ページ（全面画像） */
export const PDF_BIRTHDAY_GUIDE_PAGE_PATH = `${process.cwd()}/src/components/pdf/assets/birthday-guide.png`;

/**
 * バースデー本文1枚目のみ（装飾入り背景。2枚目以降は白地）。デザイン元は `haikei_b2.pdf`。
 * `BirthdayPage` は 1P で中見出し＋「テーマ」本文、2P 以降に結果本文を配置。PNG 差し替え後は `npm run fix:birthday-bg-header`。
 */
export const PDF_BIRTHDAY_FIRST_PAGE_PATH = `${process.cwd()}/src/components/pdf/assets/birthday-first-page.png`;

/** 「マチュリティナンバーとは」ガイド1ページ（全面画像） */
export const PDF_MATURITY_GUIDE_PAGE_PATH = `${process.cwd()}/src/components/pdf/assets/maturity-guide.png`;

/**
 * マチュリティ本文1枚目のみ（装飾入り背景。2枚目以降は白地）。デザイン元は `haikei_m2.pdf`。
 * PNG 差し替え後は `npm run fix:maturity-bg-header`。見出し位置は `maturityNumberFirstPageHero`。
 */
export const PDF_MATURITY_FIRST_PAGE_PATH = `${process.cwd()}/src/components/pdf/assets/maturity-first-page.png`;

export const PDF_CORE_RESULT_CONTINUATION_BACKGROUND_PATH = `${process.cwd()}/src/components/pdf/assets/haikei-kekka2.png`;

/** パーソナルイヤー前・フクロウ先生からのメッセージ（全面画像） */
export const PDF_PERSONAL_YEAR_MESSAGE_PAGE_PATH = `${process.cwd()}/src/components/pdf/assets/personal-year-message.png`;

/** パーソナルイヤー前・導入（全面画像） */
export const PDF_PERSONAL_YEAR_GUIDE_PAGE_PATH = `${process.cwd()}/src/components/pdf/assets/personal-year-guide.png`;

/** ブリッジナンバー導入 1 ページ目（全面画像） */
export const PDF_BRIDGE_INTRO_PAGE_1_PATH = `${process.cwd()}/src/components/pdf/assets/bridge-intro-1.png`;

/** ブリッジナンバー導入 2 ページ目（全面画像） */
export const PDF_BRIDGE_INTRO_PAGE_2_PATH = `${process.cwd()}/src/components/pdf/assets/bridge-intro-2.png`;

/** ブリッジ章切り替えページ（全面画像） */
export const PDF_BRIDGE_SECTION_COVER_PATH = `${process.cwd()}/src/components/pdf/assets/bridge-section-cover.png`;

/** ブリッジ一致度スター画像（1〜5） */
export const PDF_BRIDGE_STAR_1_PATH = `${process.cwd()}/src/components/pdf/assets/bridge-star-1.png`;
export const PDF_BRIDGE_STAR_2_PATH = `${process.cwd()}/src/components/pdf/assets/bridge-star-2.png`;
export const PDF_BRIDGE_STAR_3_PATH = `${process.cwd()}/src/components/pdf/assets/bridge-star-3.png`;
export const PDF_BRIDGE_STAR_4_PATH = `${process.cwd()}/src/components/pdf/assets/bridge-star-4.png`;
export const PDF_BRIDGE_STAR_5_PATH = `${process.cwd()}/src/components/pdf/assets/bridge-star-5.png`;

/** おまけの後に差し込む日記アプリ導線＋記入ページ（全面画像 5P） */
export const PDF_JOURNAL_INVITE_PAGE_1_PATH = `${process.cwd()}/src/components/pdf/assets/journal-invite-1.png`;
export const PDF_JOURNAL_INVITE_PAGE_2_PATH = `${process.cwd()}/src/components/pdf/assets/journal-invite-2.png`;
export const PDF_JOURNAL_INVITE_PAGE_3_PATH = `${process.cwd()}/src/components/pdf/assets/journal-invite-3.png`;
export const PDF_JOURNAL_INVITE_PAGE_4_PATH = `${process.cwd()}/src/components/pdf/assets/journal-invite-4.png`;
export const PDF_JOURNAL_INVITE_PAGE_5_PATH = `${process.cwd()}/src/components/pdf/assets/journal-invite-5.png`;
/** 章分け: 第4章扉（「この年大切にしたいこと」前） */
export const PDF_CHAPTER_4_DIVIDER_PATH = `${process.cwd()}/src/components/pdf/assets/chapter-4-divider.png`;

/** パーソナルマンス直前の補足ページ（全面画像 1P） */
export const PDF_PERSONAL_MONTH_INTRO_EXTRA_PATH = `${process.cwd()}/src/components/pdf/assets/personal-month-intro-extra.png`;

/** あとがきページ（全面画像 2P） */
export const PDF_AFTERWORD_PAGE_1_PATH = `${process.cwd()}/src/components/pdf/assets/afterword-1.png`;
export const PDF_AFTERWORD_PAGE_2_PATH = `${process.cwd()}/src/components/pdf/assets/afterword-2.png`;

/** 章分け: 第1章扉（ライフパスナンバー前） */
export const PDF_CHAPTER_1_DIVIDER_PATH = `${process.cwd()}/src/components/pdf/assets/chapter-1-divider.png`;

/** 章分け: 第2章扉（パーソナルイヤー導入前） */
export const PDF_CHAPTER_2_DIVIDER_PATH = `${process.cwd()}/src/components/pdf/assets/chapter-2-divider.png`;

/** 章分け: 第3章扉（ブリッジナンバー導入前） */
export const PDF_CHAPTER_3_DIVIDER_PATH = `${process.cwd()}/src/components/pdf/assets/chapter-3-divider.png`;

/**
 * 第3章扉の直前に pdf-lib で挿入するページ（@react-pdf 単体では外部 PDF を1ページとして載せられないため結合専用）。
 * 差し替えは同パスで上書き。
 */
export const PDF_CHAPTER_INSERT_BEFORE_3_PATH = pdfAssetPath(
  "chapter-insert-before-3.pdf",
);

/**
 * 第4章扉（おまけブロック内）の直前に pdf-lib で挿入するページ（結合専用）。
 */
export const PDF_CHAPTER_INSERT_BEFORE_4_PATH = pdfAssetPath("chapter-insert-before-4.pdf");

/** 冊子の最後に挿入する裏表紙PDF（結合専用・元 `ura.pdf`）。リポジトリ内パスで参照する。 */
export const PDF_FINAL_BACK_COVER_INSERT_PATH = pdfAssetPath("final-back-cover-insert.pdf");
