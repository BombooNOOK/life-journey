import React from "react";

import { DiaryBookPdfPageCanvas } from "@/components/pdf/diaryBook/DiaryBookPdfPageCanvas";

export function DiaryBookFullBleedPdfPage({ imageSrc }: { imageSrc: string }) {
  return <DiaryBookPdfPageCanvas backgroundSrc={imageSrc} />;
}
