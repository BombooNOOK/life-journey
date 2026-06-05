import React from "react";
import { Image, Page } from "@react-pdf/renderer";

import {
  diaryBookPdfFullBleedImageStyle,
  diaryBookPdfPageStyle,
} from "@/lib/journal/diaryBookPrintPdfLayout";

export function DiaryBookFullBleedPdfPage({ imageSrc }: { imageSrc: string }) {
  return (
    <Page size="A5" orientation="portrait" style={diaryBookPdfPageStyle} wrap={false}>
      <Image cache={false} src={imageSrc} style={diaryBookPdfFullBleedImageStyle} />
    </Page>
  );
}
