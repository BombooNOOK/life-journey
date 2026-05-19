import { PDF_TOC_LINK_DESTINATION, type PdfTocLinkDestinationId } from "./pdfTocLinkDestinations";

export type PdfTocEntry =
  | { kind: "section"; label: string; destinationId: PdfTocLinkDestinationId }
  | { kind: "item"; label: string; page: number; destinationId: PdfTocLinkDestinationId };

/** 目次右列の表示ページ（表紙除く読者向け番号）。レイアウト変更時は表示のみ更新。 */
export const PDF_TOC_ENTRIES: PdfTocEntry[] = [
  { kind: "item", label: "あなたのナンバー", page: 3, destinationId: PDF_TOC_LINK_DESTINATION.yourNumbers },
  { kind: "item", label: "はじめに", page: 4, destinationId: PDF_TOC_LINK_DESTINATION.introduction },
  { kind: "item", label: "このガイドの案内人", page: 5, destinationId: PDF_TOC_LINK_DESTINATION.guideHost },
  { kind: "item", label: "数のキーワード", page: 6, destinationId: PDF_TOC_LINK_DESTINATION.numberKeywords },
  { kind: "section", label: "第1章 今のあなたを知る", destinationId: PDF_TOC_LINK_DESTINATION.chapter1 },
  { kind: "item", label: "ライフ・パス・ナンバー", page: 8, destinationId: PDF_TOC_LINK_DESTINATION.lifePath },
  { kind: "item", label: "ディスティニー・ナンバー", page: 16, destinationId: PDF_TOC_LINK_DESTINATION.destiny },
  { kind: "item", label: "ソウル・ナンバー", page: 19, destinationId: PDF_TOC_LINK_DESTINATION.soul },
  { kind: "item", label: "パーソナリティ・ナンバー", page: 22, destinationId: PDF_TOC_LINK_DESTINATION.personality },
  { kind: "item", label: "バースデー・ナンバー", page: 25, destinationId: PDF_TOC_LINK_DESTINATION.birthday },
  { kind: "item", label: "マチュリティ・ナンバー", page: 28, destinationId: PDF_TOC_LINK_DESTINATION.maturity },
  {
    kind: "item",
    label: "フクロウ先生からのメッセージ",
    page: 31,
    destinationId: PDF_TOC_LINK_DESTINATION.fukuroChapter1,
  },
  { kind: "section", label: "第2章 これからの流れを知る", destinationId: PDF_TOC_LINK_DESTINATION.chapter2 },
  {
    kind: "item",
    label: "パーソナル・イヤー・ナンバー",
    page: 34,
    destinationId: PDF_TOC_LINK_DESTINATION.personalYear,
  },
  {
    kind: "item",
    label: "フクロウ先生からのメッセージ",
    page: 46,
    destinationId: PDF_TOC_LINK_DESTINATION.fukuroChapter2,
  },
  { kind: "section", label: "第3章 心の中のズレを知る", destinationId: PDF_TOC_LINK_DESTINATION.chapter3 },
  { kind: "item", label: "ブリッジ・ナンバー", page: 48, destinationId: PDF_TOC_LINK_DESTINATION.bridge },
  {
    kind: "item",
    label: "フクロウ先生からのメッセージ",
    page: 80,
    destinationId: PDF_TOC_LINK_DESTINATION.fukuroChapter3,
  },
  { kind: "section", label: "第4章 あなたの言葉を残す", destinationId: PDF_TOC_LINK_DESTINATION.chapter4 },
  {
    kind: "item",
    label: "この年大切にしたいこと",
    page: 82,
    destinationId: PDF_TOC_LINK_DESTINATION.journalPriorities,
  },
  {
    kind: "item",
    label: "この年を振り返って",
    page: 83,
    destinationId: PDF_TOC_LINK_DESTINATION.journalRetrospect,
  },
  { kind: "item", label: "余白のページ", page: 84, destinationId: PDF_TOC_LINK_DESTINATION.journalMemo },
  {
    kind: "item",
    label: "フクロウ先生からのメッセージ",
    page: 86,
    destinationId: PDF_TOC_LINK_DESTINATION.fukuroChapter4,
  },
  {
    kind: "item",
    label: "今日から３か月の流れ",
    page: 87,
    destinationId: PDF_TOC_LINK_DESTINATION.personalMonthFlow,
  },
  { kind: "item", label: "おわりに", page: 88, destinationId: PDF_TOC_LINK_DESTINATION.afterword },
];
