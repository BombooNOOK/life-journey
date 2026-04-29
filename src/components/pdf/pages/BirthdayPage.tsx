import { View } from "@react-pdf/renderer";

import { PdfLongFormBody } from "../PdfLongFormBody";
import { PdfText as Text } from "../PdfText";
import { PdfPageFrame } from "../PdfPageFrame";

import { getBirthdayArticle } from "@/lib/numerology/birthdayData";
import { breakTitleAtCommaForPdf } from "@/lib/pdf/breakTitleAtComma";
import { PDF_BIRTHDAY_FIRST_PAGE_PATH } from "../pdfAssetPaths";

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
    >
        <Text style={pdfStyles.muted}>バースデー本文データが未登録のため、このページは簡易表示です。</Text>
      </PdfPageFrame>
    );
  }

  return (
    <>
      <PdfPageFrame
        title={headerTitle}
        pageType="body"
        firstPageBodyBackgroundSrc={PDF_BIRTHDAY_FIRST_PAGE_PATH}
      >
        {/* 1 枚目全面背景: 強み（中見出し）＋テーマ本文（ラベル「テーマ」は非表示、間隔はスペーサーで維持） */}
        <View style={pdfStyles.birthdayNumberFirstPageHero}>
          <Text style={pdfStyles.resultTitle}>{breakTitleAtCommaForPdf(data.strength)}</Text>
          <View style={pdfStyles.birthdayThemeEyebrowSpacer} />
          <PdfLongFormBody
            text={data.theme}
            readableSentenceWrap
            marginTop={2}
            {...pdfLongFormProseProps}
            continuationPageTopGap={0}
            bodyStyle={[
              ...(bodyStyle == null ? [] : Array.isArray(bodyStyle) ? bodyStyle : [bodyStyle]),
              { textAlign: "center" as const },
            ]}
            expandWidth={bodyExpandWidth}
          />
        </View>
      </PdfPageFrame>
      <PdfPageFrame title={headerTitle} pageType="body">
        <View style={pdfStyles.lifePathSectionBlock}>
          <PdfLongFormBody
            text={data.article}
            readableSentenceWrap
            marginTop={2}
            {...pdfLongFormProsePropsWithTallContinuation}
            bodyStyle={bodyStyle}
            expandWidth={bodyExpandWidth}
          />
        </View>
      </PdfPageFrame>
    </>
  );
}
