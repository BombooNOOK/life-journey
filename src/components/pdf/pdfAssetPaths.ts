/**
 * PDF 用の画像パス（サーバー側 `renderToBuffer` / API と同じ cwd 前提）。
 *
 * - はじめに 1P: `introduction-page-1-bg.png` + 生成テキスト（`IntroductionPage1`）。レガシー `introduction-page-1.png` は参照用
 * - はじめに 2P: `introduction-page-2-bg.png` + 生成テキスト（`IntroductionPage2`）。レガシー `introduction-page-2.png` は参照用
 * - 表紙の次・中表紙（扉絵）: `inside-cover-page-bg.png` + 生成テキスト（`InsideCoverPage`）。レガシー `inside-cover-page.png` は参照用
 * - 表紙: `cover-template-bg.png` + 生成テキスト（`CoverPage`）。レガシー `cover-template.png` は参照用
 * - 「〇〇ナンバーとは」7種: `number-guide-bg.png` + 生成テキスト（`NumberGuideBleedPage`）。
 *   レガシー `life-path-guide.png` 等の全面PNGは参照用に残置
 * - コア中間扉: `core-number-first-bg.png` + 生成テキスト（`CoreNumberIntroBleedPage`・6種共通）
 * - ディスティニー本文1枚目: `destiny-first-page.png`（レガシー）。キーワード1枚目は `haikei-kekka2.png`
 * - ソウル本文1枚目: `soul-first-page.png`（`SoulPage`・1枚目のみ全面）
 * - パーソナリティ本文1枚目: `personality-first-page.png`（`PersonalityPage`・1P 全面＋2P 以降に本文）
 * - バースデー本文1枚目: `birthday-first-page.png`（`BirthdayPage`・1枚目のみ全面）
 * - 「マチュリティナンバーとは」: `maturity-guide.png`（`MaturityGuidePage`・全面）
 * - マチュリティ本文1枚目: `maturity-first-page.png`（`MaturityPage`・1枚目のみ全面・元 `haikei_m2.pdf`）
 * - パーソナルイヤー章前メッセージ: `personal-year-message-bg.png` + 生成テキスト（`PersonalYearMessagePage`）
 * - パーソナルイヤー章末装飾（鳥の足跡）: `personal-year-chapter-transition.png`（`PersonalYearChapterTransitionPage`）
 * - パーソナルイヤー章後メッセージ: `personal-year-after-message-bg.png` + 生成テキスト（`PersonalYearAfterMessagePage`）
 * - ブリッジ章後メッセージ: `bridge-after-message-bg.png` + 生成テキスト（`BridgeAfterMessagePage`）
 * - パーソナルイヤー「とは」: `number-guide-bg`（`PersonalYearGuidePage`）
 * - 見開き本文: 左ページ用 / 右ページ用（3P以降の奇偶。2Pは本文1P＝右用）
 * - 裏表紙: 最終ページ
 *
 * 差し替えは各 PNG を同パスで上書きするか、このファイルのパスを変更してください。
 *
 * 解像度：大型表示・製本を想定する全面背景は A5 長辺でおおよそ 1700px 級（300dpi 帯）が目安。
 * 低解像度のままの画像は差し替え時に高解像度版を推奨（詳細は `.cursor/rules/numerology-pdf-booklet.mdc`）。
 */
import fs from "node:fs";
import path from "node:path";

import { getPdfRenderQuality } from "./pdfRenderQualityState";

/** 結合用 PDF などサーバー実行時に必ず読むアセット（Vercel では `import.meta.url` 基準だとビルド出力側にファイルが無く ENOENT になりがち） */
function pdfServerAssetPath(fileName: string): string {
  return path.join(process.cwd(), "src/components/pdf/assets", fileName);
}
/** はじめに 1ページ目・文字なし背景（生成テキストを重ねる） */
export const PDF_INTRODUCTION_PAGE_1_BG_PATH = `${process.cwd()}/src/components/pdf/assets/introduction-page-1-bg.png`;

/** はじめに 1ページ目（レガシー・文字込み全面画像。参照用に残置） */
export const PDF_INTRODUCTION_PAGE_1_PATH = `${process.cwd()}/src/components/pdf/assets/introduction-page-1.png`;

/** はじめに 2ページ目・文字なし背景（2P 移行用。未配置時は全面 PNG のまま） */
export const PDF_INTRODUCTION_PAGE_2_BG_PATH = `${process.cwd()}/src/components/pdf/assets/introduction-page-2-bg.png`;

/** はじめに 2ページ目「このガイドの案内人」（全面画像・2P 移行まで） */
export const PDF_INTRODUCTION_PAGE_2_PATH = `${process.cwd()}/src/components/pdf/assets/introduction-page-2.png`;

/** 中表紙・文字なし背景 */
export const PDF_INSIDE_COVER_PAGE_BG_PATH = `${process.cwd()}/src/components/pdf/assets/inside-cover-page-bg.png`;

/** 中表紙（レガシー・文字込み全面画像。参照用に残置） */
export const PDF_INSIDE_COVER_PAGE_PATH = `${process.cwd()}/src/components/pdf/assets/inside-cover-page.png`;

/** 表紙・文字なし背景（`cover01` / `cover02` を重ねる） */
export const PDF_COVER_TEMPLATE_BG_PATH = `${process.cwd()}/src/components/pdf/assets/cover-template-bg.png`;

/** 表紙（レガシー・文字込み全面画像。参照用に残置） */
export const PDF_COVER_IMAGE_PATH = `${process.cwd()}/src/components/pdf/assets/cover-template.png`;

/** 「〇〇ナンバーとは」7ページ共通の文字なし背景（生成テキストを重ねる） */
export const PDF_NUMBER_GUIDE_BG_PATH = `${process.cwd()}/src/components/pdf/assets/number-guide-bg.png`;

/** 「ライフパスナンバーとは」ガイド1ページ（レガシー・文字込み全面画像。参照用に残置） */
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

/**
 * 目次（`CustomerPage`）およびコア本文2枚目以降の地。上端は帯ヘッダーと重なるため **透明化必須**。
 * 差し替え後にヘッダー／ページ番号が隠れる → `npm run fix:toc-continuation-bg-header`（`transparentizeCoreFirstPageHeaderBand.py`）。
 * 検証手順は `docs/pdf-booklet-layout-playbook-ja.md`。
 */
export const PDF_CORE_RESULT_CONTINUATION_BACKGROUND_PATH = `${process.cwd()}/src/components/pdf/assets/haikei-kekka2.png`;

/** コアナンバー中間扉・6種共通の文字なし背景 */
export const PDF_CORE_NUMBER_FIRST_BG_PATH = `${process.cwd()}/src/components/pdf/assets/core-number-first-bg.png`;

/** パーソナルイヤー章前・フクロウ先生メッセージ（文字なし背景） */
export const PDF_PERSONAL_YEAR_MESSAGE_BG_PATH = `${process.cwd()}/src/components/pdf/assets/personal-year-message-bg.png`;

/** レガシー・文字込み全面（参照用） */
export const PDF_PERSONAL_YEAR_MESSAGE_PAGE_PATH = `${process.cwd()}/src/components/pdf/assets/personal-year-message.png`;

/** パーソナルイヤー章末〜ブリッジ章前の装飾（全面画像・旧 blank02 / chapter-insert-before-4 相当） */
export const PDF_PERSONAL_YEAR_CHAPTER_TRANSITION_PATH = `${process.cwd()}/src/components/pdf/assets/personal-year-chapter-transition.png`;

/** パーソナルイヤー章後・フクロウ先生メッセージ（文字なし背景） */
export const PDF_PERSONAL_YEAR_AFTER_MESSAGE_BG_PATH = `${process.cwd()}/src/components/pdf/assets/personal-year-after-message-bg.png`;

/** パーソナルイヤー前・導入（全面画像） */
export const PDF_PERSONAL_YEAR_GUIDE_PAGE_PATH = `${process.cwd()}/src/components/pdf/assets/personal-year-guide.png`;

/** ブリッジ章後・フクロウ先生メッセージ（文字なし背景） */
export const PDF_BRIDGE_AFTER_MESSAGE_BG_PATH = `${process.cwd()}/src/components/pdf/assets/bridge-after-message-bg.png`;

/** ブリッジナンバー「とは」1 ページ目・文字なし背景（`hon_bri01`） */
export const PDF_BRIDGE_GUIDE_PAGE_1_BG_PATH = `${process.cwd()}/src/components/pdf/assets/bridge-guide-page-1-bg.png`;

/** ブリッジナンバー「とは」2 ページ目・文字なし背景（`hon_bri02`） */
export const PDF_BRIDGE_GUIDE_PAGE_2_BG_PATH = `${process.cwd()}/src/components/pdf/assets/bridge-guide-page-2-bg.png`;

/** ブリッジナンバー導入 1 ページ目（レガシー・全面画像） */
export const PDF_BRIDGE_INTRO_PAGE_1_PATH = `${process.cwd()}/src/components/pdf/assets/bridge-intro-1.png`;

/** ブリッジナンバー導入 2 ページ目（レガシー・全面画像） */
export const PDF_BRIDGE_INTRO_PAGE_2_PATH = `${process.cwd()}/src/components/pdf/assets/bridge-intro-2.png`;

/**
 * レガシー（旧PY章後フクロウの文字込み全面と同一内容）。鑑定PDFでは未使用。
 * 第3章扉は `PDF_CHAPTER_3_DIVIDER_PATH` / `Chapter3DividerPage`。
 */
export const PDF_BRIDGE_SECTION_COVER_PATH = `${process.cwd()}/src/components/pdf/assets/bridge-section-cover.png`;

/** ブリッジ一致度スター画像（1〜5） */
export const PDF_BRIDGE_STAR_1_PATH = `${process.cwd()}/src/components/pdf/assets/bridge-star-1.png`;
export const PDF_BRIDGE_STAR_2_PATH = `${process.cwd()}/src/components/pdf/assets/bridge-star-2.png`;
export const PDF_BRIDGE_STAR_3_PATH = `${process.cwd()}/src/components/pdf/assets/bridge-star-3.png`;
export const PDF_BRIDGE_STAR_4_PATH = `${process.cwd()}/src/components/pdf/assets/bridge-star-4.png`;
export const PDF_BRIDGE_STAR_5_PATH = `${process.cwd()}/src/components/pdf/assets/bridge-star-5.png`;

/** おまけの後に差し込むあしあとアプリ導線＋記入ページ（全面画像 5P） */
export const PDF_JOURNAL_INVITE_PAGE_1_PATH = `${process.cwd()}/src/components/pdf/assets/journal-invite-1.png`;
/** レガシー・文字込み全面（参照用） */
export const PDF_JOURNAL_INVITE_PAGE_2_PATH = `${process.cwd()}/src/components/pdf/assets/journal-invite-2.png`;

/** 第4章「この年大切にしたいこと」（文字なし背景） */
export const PDF_JOURNAL_INVITE_2_BG_PATH = `${process.cwd()}/src/components/pdf/assets/journal-invite-2-bg.png`;
/** レガシー・文字込み全面（参照用） */
export const PDF_JOURNAL_INVITE_PAGE_3_PATH = `${process.cwd()}/src/components/pdf/assets/journal-invite-3.png`;

/** 第4章「この年を振り返って」（文字なし背景） */
export const PDF_JOURNAL_INVITE_3_BG_PATH = `${process.cwd()}/src/components/pdf/assets/journal-invite-3-bg.png`;
/** レガシー・文字込み全面（参照用） */
export const PDF_JOURNAL_INVITE_PAGE_4_PATH = `${process.cwd()}/src/components/pdf/assets/journal-invite-4.png`;

/** 余白ページ・左（方眼のみ・文字なし背景） */
export const PDF_JOURNAL_INVITE_4_BG_PATH = `${process.cwd()}/src/components/pdf/assets/journal-invite-4-bg.png`;

/** レガシー・文字込み全面（参照用） */
export const PDF_JOURNAL_INVITE_PAGE_5_PATH = `${process.cwd()}/src/components/pdf/assets/journal-invite-5.png`;

/** 余白ページ・右（フクロウ先生つき・文字なし背景） */
export const PDF_JOURNAL_INVITE_5_BG_PATH = `${process.cwd()}/src/components/pdf/assets/journal-invite-5-bg.png`;
/** 章扉・4章共通の文字なし背景 */
export const PDF_CHAPTER_DIVIDER_BG_PATH = `${process.cwd()}/src/components/pdf/assets/chapter-divider-bg.png`;

/** 章分け: 第4章扉（レガシー・文字込み全面画像。参照用に残置） */
export const PDF_CHAPTER_4_DIVIDER_PATH = `${process.cwd()}/src/components/pdf/assets/chapter-4-divider.png`;

/** パーソナルマンス直前の補足ページ（全面画像 1P） */
/** レガシー・あしあと案内全面（参照用） */
export const PDF_PERSONAL_MONTH_INTRO_EXTRA_PATH = `${process.cwd()}/src/components/pdf/assets/personal-month-intro-extra.png`;

/** 第4章末・フクロウ先生メッセージ＋あしあと案内（文字なし背景） */
export const PDF_JOURNAL_DIARY_INVITE_BG_PATH = `${process.cwd()}/src/components/pdf/assets/journal-diary-invite-bg.png`;

/** あしあと案内 QR（`shime_qr`） */
export const PDF_JOURNAL_DIARY_INVITE_QR_PATH = `${process.cwd()}/src/components/pdf/assets/journal-diary-invite-qr.png`;

/** おわりに・左P（文字なし背景） */
export const PDF_AFTERWORD_1_BG_PATH = `${process.cwd()}/src/components/pdf/assets/afterword-1-bg.png`;

/** おわりに・右P（文字なし背景） */
export const PDF_AFTERWORD_2_BG_PATH = `${process.cwd()}/src/components/pdf/assets/afterword-2-bg.png`;

/** レガシー・おわりに全面（参照用） */
export const PDF_AFTERWORD_PAGE_1_PATH = `${process.cwd()}/src/components/pdf/assets/afterword-1.png`;
export const PDF_AFTERWORD_PAGE_2_PATH = `${process.cwd()}/src/components/pdf/assets/afterword-2.png`;

/** 章分け: 第1章扉（レガシー・文字込み全面画像。参照用に残置） */
export const PDF_CHAPTER_1_DIVIDER_PATH = `${process.cwd()}/src/components/pdf/assets/chapter-1-divider.png`;

/** 章分け: 第2章扉（レガシー・文字込み全面画像。参照用に残置） */
export const PDF_CHAPTER_2_DIVIDER_PATH = `${process.cwd()}/src/components/pdf/assets/chapter-2-divider.png`;

/** 章分け: 第3章扉（レガシー・文字込み全面画像。参照用に残置） */
export const PDF_CHAPTER_3_DIVIDER_PATH = `${process.cwd()}/src/components/pdf/assets/chapter-3-divider.png`;

/**
 * 第3章扉の直前に pdf-lib で挿入するページ（@react-pdf 単体では外部 PDF を1ページとして載せられないため結合専用）。
 * 差し替えは同パスで上書き。
 */
export const PDF_CHAPTER_INSERT_BEFORE_3_PATH = pdfServerAssetPath("chapter-insert-before-3.pdf");

/**
 * 第4章扉（おまけブロック内）の直前に pdf-lib で挿入するページ（結合専用）。
 */
export const PDF_CHAPTER_INSERT_BEFORE_4_PATH = pdfServerAssetPath("chapter-insert-before-4.pdf");

/** 冊子の最後に挿入する裏表紙PDF（結合専用・元 `ura.pdf`）。リポジトリ内パスで参照する。 */
export const PDF_FINAL_BACK_COVER_INSERT_PATH = pdfServerAssetPath("final-back-cover-insert.pdf");

const PREVIEW_ASSETS_DIR = path.join(process.cwd(), "src/components/pdf/assets-preview");

/** `assets-preview/` で探すファイル名（本番が .png のとき .jpg プレビューも許容） */
function previewAssetCandidateNames(fullResolutionPath: string): string[] {
  const base = path.basename(fullResolutionPath);
  const lower = base.toLowerCase();
  if (!lower.endsWith(".png") && !lower.endsWith(".jpg") && !lower.endsWith(".jpeg")) {
    return [];
  }
  const stem = base.replace(/\.(png|jpe?g)$/i, "");
  const names = [base];
  if (lower.endsWith(".png")) {
    names.push(`${stem}.jpg`, `${stem}.jpeg`);
  }
  return [...new Set(names)];
}

/**
 * プレビュー（quality=low）時、`assets-preview/` に低解像度版があれば使う。
 * 自動生成（`npm run pdf:preview-assets`）は同名の .jpg（既定: 長辺 720px・JPEG quality 60・透過は白合成）。
 * 本文のフォントサイズは変えず、見え方のレイアウトは製本用と同一にする想定。
 */
export function resolvePdfAssetPath(fullResolutionPath: string): string {
  if (getPdfRenderQuality() !== "low") return fullResolutionPath;
  for (const name of previewAssetCandidateNames(fullResolutionPath)) {
    const candidate = path.join(PREVIEW_ASSETS_DIR, name);
    try {
      if (fs.existsSync(candidate)) return candidate;
    } catch {
      /* noop */
    }
  }
  return fullResolutionPath;
}
