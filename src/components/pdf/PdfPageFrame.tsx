import type { PropsWithChildren } from "react";
import { Image, Page, Text as RawText, View } from "@react-pdf/renderer";
import type { Orientation, PageSize } from "@react-pdf/types";

import { resolvePdfAssetPath } from "./pdfAssetPaths";
import { bindingBackgroundImageSrc } from "./pdfBindingBackground";
import { getPdfPageNumberOffset } from "./pdfPageNumberOffset";
import { pdfStyles } from "./styles";

type PdfPageType = "door" | "guide" | "body" | "writing";

type Props = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  /** 無線綴じ想定の見開き背景（2P＝本文1Pは右、3P以降奇左偶右、最終＝裏表紙） */
  showBindingBackground?: boolean;
  /**
   * 全面画像のみ（本文 children は使わない）。帯ヘッダーは出さない想定（`showHeader` は無視）。
   * ページ番号（右上オーバーレイ）は `showFooter` で制御（はじめに・扉絵・導入全面など）。
   */
  fullBleedImageSrc?: string;
  /** コア本文 1 ページ目に敷く背景（ヘッダーとページ番号を避ける） */
  firstPageBodyBackgroundSrc?: string;
  /** コア本文 2 ページ目以降に敷く背景（全面） */
  continuationBodyBackgroundSrc?: string;
  size?: PageSize;
  orientation?: Orientation;
  pageType?: PdfPageType;
}>;

type ViewRenderPageProps = {
  pageNumber: number;
  subPageNumber: number;
  /** レイアウト後の最終ページ数（型定義に無いが @react-pdf/layout で付与される） */
  totalPages?: number;
};

/** 表紙を番号に含めない運用（目次と一致） */
function displayPageAndTotal(pageNumber: number, totalPages: number | undefined): {
  displayPage: number;
  displayTotal: number;
} {
  const pn = typeof pageNumber === "number" && pageNumber > 0 ? pageNumber : 1;
  const total = typeof totalPages === "number" && totalPages > 0 ? totalPages : pn;
  return {
    displayPage: Math.max(1, pn - 1),
    displayTotal: Math.max(1, total - 1),
  };
}

/** 右上・ヘッダー右の共通表記（目次の「…… n」と同じく表紙を読者向け総ページに含めない） */
function formatReaderPageLabel(
  pageNumber: number,
  totalPages: number | undefined,
  pageNumberOffset: number,
): string {
  const adjustedPage = pageNumber + pageNumberOffset;
  const adjustedTotal =
    typeof totalPages === "number" && totalPages > 0 ? totalPages + pageNumberOffset : totalPages;
  const { displayPage } = displayPageAndTotal(adjustedPage, adjustedTotal);
  return String(displayPage);
}

export function PdfPageFrame({
  title,
  subtitle,
  showHeader = true,
  showFooter = true,
  showBindingBackground = false,
  fullBleedImageSrc,
  firstPageBodyBackgroundSrc,
  continuationBodyBackgroundSrc,
  size = "A5",
  orientation = "portrait",
  pageType = "body",
  children,
}: Props) {
  const pageNumberOffset = getPdfPageNumberOffset();
  const backgroundOpacityByType: Record<PdfPageType, number> = {
    door: 1,
    guide: 0.9,
    body: 0.85,
    writing: 0.72,
  };

  const pageNumberStyle = fullBleedImageSrc
    ? pdfStyles.pageNumberOverlayFullBleed
    : pdfStyles.pageNumberOverlay;

  /** 全面画像・ヘッダーなしのときのみページ全体座標の absolute */
  const floatingPageNumberBlock =
    showFooter && (!showHeader || fullBleedImageSrc) ? (
      <RawText
        fixed
        style={pageNumberStyle}
        render={({ pageNumber, totalPages }) =>
          formatReaderPageLabel(pageNumber, totalPages, pageNumberOffset)
        }
      />
    ) : null;

  const headerInlinePageNumber =
    showHeader && showFooter && !fullBleedImageSrc ? (
      <View style={pdfStyles.pageHeaderPageNumberWrap}>
        <RawText
          style={pdfStyles.pageHeaderPageNumber}
          render={({ pageNumber, totalPages }) =>
            formatReaderPageLabel(pageNumber, totalPages, pageNumberOffset)
          }
        />
      </View>
    ) : null;

  if (fullBleedImageSrc) {
    const bleedSrc = resolvePdfAssetPath(fullBleedImageSrc);
    return (
      <Page size={size} orientation={orientation} style={[pdfStyles.page, { padding: 0 }]}>
        <View style={{ width: "100%", height: "100%", zIndex: 0 }}>
          <Image
            cache={false}
            src={bleedSrc}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </View>
        {floatingPageNumberBlock}
      </Page>
    );
  }

  return (
    <Page size={size} orientation={orientation} style={pdfStyles.page}>
      {firstPageBodyBackgroundSrc ? (
        <View
          style={[pdfStyles.pageBackgroundLeaveFooter, { top: 18 }]}
          fixed
          render={(props) => {
            const p = props as ViewRenderPageProps;
            if (p.subPageNumber !== 1) return null;
            return (
              <Image
                cache={false}
                src={resolvePdfAssetPath(firstPageBodyBackgroundSrc)}
                style={pdfStyles.pageBindingBackgroundImage}
              />
            );
          }}
        />
      ) : null}
      {continuationBodyBackgroundSrc ? (
        <View
          style={[pdfStyles.pageBackground, { top: 18 }]}
          fixed
          render={(props) => {
            const p = props as ViewRenderPageProps;
            if (p.subPageNumber <= 1) return null;
            return (
              <Image
                cache={false}
                src={resolvePdfAssetPath(continuationBodyBackgroundSrc)}
                style={pdfStyles.pageBindingBackgroundImage}
              />
            );
          }}
        />
      ) : null}
      {showBindingBackground ? (
        <View
          style={pdfStyles.pageBackground}
          fixed
          render={(props) => {
            const p = props as ViewRenderPageProps;
            const adjustedPage = p.pageNumber + pageNumberOffset;
            const totalPages =
              typeof p.totalPages === "number" && p.totalPages > 0 ? p.totalPages + pageNumberOffset : 1;
            const src = bindingBackgroundImageSrc(adjustedPage, totalPages);
            if (!src) return null;
            return (
              <Image
                src={resolvePdfAssetPath(src)}
                style={[
                  pdfStyles.pageBindingBackgroundImage,
                  { opacity: backgroundOpacityByType[pageType] },
                ]}
              />
            );
          }}
        />
      ) : null}
      {showHeader ? (
        <View style={pdfStyles.pageHeader} fixed>
          <View style={pdfStyles.pageHeaderTitleRow}>
            <RawText style={pdfStyles.pageHeaderTitle}>{title ?? "数秘術 鑑定書"}</RawText>
            <View style={pdfStyles.pageHeaderRule} />
            {headerInlinePageNumber}
          </View>
          {subtitle ? <RawText style={pdfStyles.pageHeaderSubtitle}>{subtitle}</RawText> : null}
        </View>
      ) : null}

      <View style={[pdfStyles.pageBody, { marginTop: 16 }]}>
        <View
          render={(props) => {
            const p = props as ViewRenderPageProps;
            return <View style={{ height: p.subPageNumber > 1 ? 18 : 0 }} />;
          }}
        />
        {children}
      </View>

      {floatingPageNumberBlock}
    </Page>
  );
}
