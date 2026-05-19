/** 原稿の改行（句読点ごと）を維持。段落間は空行、行間は `lineHeight: 1.65` */
export const pdfGuideBleedBodyProseProps = {
  firstParagraphMarginTop: 0,
  paragraphGap: 6,
  majorBlockExtraGap: 0,
  sentenceLineGap: 0,
  continuationPageTopGap: 0,
} as const;
