import React from "react";
import { Image, Page, View } from "@react-pdf/renderer";

import {
  diaryBookPdfFullBleedImageStyle,
  diaryBookPdfOverlayRootStyle,
  diaryBookPdfPageCanvasStyle,
  diaryBookPdfPageStyle,
} from "@/lib/journal/diaryBookPrintPdfLayout";

type Props = {
  backgroundSrc?: string;
  children?: React.ReactNode;
};

/** 日記ブック PDF 共通：A5 1ページ＝背景＋オーバーレイ */
export function DiaryBookPdfPageCanvas({ backgroundSrc, children }: Props) {
  return (
    <Page size="A5" orientation="portrait" style={diaryBookPdfPageStyle}>
      <View wrap={false} style={diaryBookPdfPageCanvasStyle}>
        {backgroundSrc ? (
          <Image cache={false} src={backgroundSrc} style={diaryBookPdfFullBleedImageStyle} />
        ) : null}
        {children ? <View style={diaryBookPdfOverlayRootStyle}>{children}</View> : null}
      </View>
    </Page>
  );
}
