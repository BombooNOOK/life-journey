import { View } from "@react-pdf/renderer";

import { PdfLongFormBody } from "../PdfLongFormBody";
import { PdfText as Text } from "../PdfText";
import { PdfPageFrame } from "../PdfPageFrame";

import { getBirthdayArticle } from "@/lib/numerology/birthdayData";
import { breakTitleAtCommaForPdf } from "@/lib/pdf/breakTitleAtComma";
import {
  PDF_BIRTHDAY_FIRST_PAGE_PATH,
  PDF_CORE_RESULT_CONTINUATION_BACKGROUND_PATH,
} from "../pdfAssetPaths";

import { pdfLongFormProseProps, pdfLongFormProsePropsWithTallContinuation } from "../pdfLongFormSpacing";
import type { BodyRenderOverrides } from "../pdfRenderConfig";
import { pdfStyles } from "../styles";

interface Props extends BodyRenderOverrides {
  birthday: number | null | undefined;
}
export function BirthdayPage({ birthday, bodyStyle, bodyExpandWidth }: Props) {
  const data = getBirthdayArticle(birthday ?? null);
  const headerTitle = `バースデー・ナンバー ${birthday ?? "—"}`;

  if (!data) {
    return (
      <PdfPageFrame
      title={headerTitle}
      pageType="body"
      firstPageBodyBackgroundSrc={PDF_BIRTHDAY_FIRST_PAGE_PATH}
      continuationBodyBackgroundSrc={PDF_CORE_RESULT_CONTINUATION_BACKGROUND_PATH}
    >
        <Text style={pdfStyles.muted}>バースデー本文データが未登録のため、このページは簡易表示です。</Text>
      </PdfPageFrame>
    );
  }

  return (
    <PdfPageFrame
      title={headerTitle}
      pageType="body"
      firstPageBodyBackgroundSrc={PDF_BIRTHDAY_FIRST_PAGE_PATH}
      continuationBodyBackgroundSrc={PDF_CORE_RESULT_CONTINUATION_BACKGROUND_PATH}
    >
      <View style={pdfStyles.lifePathFirstPageContent}>
        <Text style={pdfStyles.resultTitle}>{breakTitleAtCommaForPdf(data.strength)}</Text>
        <Text style={pdfStyles.bodySectionEyebrow}>テーマ</Text>
      </View>
      <PdfLongFormBody
        text={data.theme}
        readableSentenceWrap
        marginTop={2}
        {...pdfLongFormProseProps}
        bodyStyle={bodyStyle}
        expandWidth={bodyExpandWidth}
      />
      <View style={pdfStyles.subtleDivider} />
      <PdfLongFormBody
        text={data.article}
        readableSentenceWrap
        marginTop={2}
        {...pdfLongFormProsePropsWithTallContinuation}
        bodyStyle={bodyStyle}
        expandWidth={bodyExpandWidth}
      />
    </PdfPageFrame>
  );
}
