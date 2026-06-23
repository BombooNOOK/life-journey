import React from "react";

import { DiaryBookFullBleedPdfPage } from "@/components/pdf/diaryBook/DiaryBookFullBleedPdfPage";
import { diaryBookNumerologyQuickReferenceImagePath } from "@/lib/journal/diaryBookAssets";
import { resolveDiaryBookPublicImagePath } from "@/lib/journal/diaryBookPrintPdfAssets";

type Props = {
  imageSrc?: string;
};

export function DiaryBookNumerologyQuickReferencePdfPage({
  imageSrc = resolveDiaryBookPublicImagePath(diaryBookNumerologyQuickReferenceImagePath()),
}: Props) {
  return <DiaryBookFullBleedPdfPage imageSrc={imageSrc} />;
}
