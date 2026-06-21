/**
 * 製本プレビュー向け Klee One の @fontsource 読み込み。
 * PDF スクリプトからは diaryBookEntryLabelFont を直接 import すること（CSS を避ける）。
 */
import "@fontsource/klee-one/400.css";
import "@fontsource/klee-one/600.css";

export {
  DIARY_BOOK_ENTRY_V2_LABEL_FONT_FAMILY_PDF,
  DIARY_PREVIEW_LABEL_BASE_STYLE,
  DIARY_PREVIEW_LABEL_FONT_FAMILY,
} from "./diaryBookEntryLabelFont";
