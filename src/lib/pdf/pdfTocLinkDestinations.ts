/**
 * 軽量版 PDF 目次の内部リンク先 id（`@react-pdf/renderer` の `<Page id>` / `<Link src="#…">`）。
 * 表示ページ番号とは独立。ページ順を変えたら各ページ側の id 付与位置を合わせること。
 */
export const PDF_TOC_LINK_DESTINATION = {
  yourNumbers: "toc-your-numbers",
  introduction: "toc-introduction",
  guideHost: "toc-guide-host",
  numberKeywords: "toc-number-keywords",
  chapter1: "toc-chapter-1",
  lifePath: "toc-life-path",
  destiny: "toc-destiny",
  soul: "toc-soul",
  personality: "toc-personality",
  birthday: "toc-birthday",
  maturity: "toc-maturity",
  fukuroChapter1: "toc-fukuro-ch1",
  chapter2: "toc-chapter-2",
  personalYear: "toc-personal-year",
  fukuroChapter2: "toc-fukuro-ch2",
  chapter3: "toc-chapter-3",
  bridge: "toc-bridge",
  fukuroChapter3: "toc-fukuro-ch3",
  chapter4: "toc-chapter-4",
  journalPriorities: "toc-journal-priorities",
  journalRetrospect: "toc-journal-retrospect",
  journalMemo: "toc-journal-memo",
  fukuroChapter4: "toc-fukuro-ch4",
  personalMonthFlow: "toc-personal-month-flow",
  afterword: "toc-afterword",
} as const;

export type PdfTocLinkDestinationId =
  (typeof PDF_TOC_LINK_DESTINATION)[keyof typeof PDF_TOC_LINK_DESTINATION];

/** 「〇〇ナンバーとは」（`NumberGuideBleedPage`）の目次リンク先。中間扉・結果本文には付けない。 */
export const NUMBER_GUIDE_TOC_DESTINATION: Record<
  | "lifePath"
  | "destiny"
  | "soul"
  | "personality"
  | "birthday"
  | "maturity"
  | "personalYear",
  PdfTocLinkDestinationId
> = {
  lifePath: PDF_TOC_LINK_DESTINATION.lifePath,
  destiny: PDF_TOC_LINK_DESTINATION.destiny,
  soul: PDF_TOC_LINK_DESTINATION.soul,
  personality: PDF_TOC_LINK_DESTINATION.personality,
  birthday: PDF_TOC_LINK_DESTINATION.birthday,
  maturity: PDF_TOC_LINK_DESTINATION.maturity,
  personalYear: PDF_TOC_LINK_DESTINATION.personalYear,
};
