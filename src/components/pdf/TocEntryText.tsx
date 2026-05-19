import type { Style } from "@react-pdf/types";
import { Link } from "@react-pdf/renderer";

import { PdfText as Text } from "./PdfText";
import { getPdfRenderQuality } from "./pdfRenderQualityState";

import type { PdfTocLinkDestinationId } from "@/lib/pdf/pdfTocLinkDestinations";

const TOC_LINK_TEXT_COLOR = "#4d4d4d";

type Props = {
  destinationId: PdfTocLinkDestinationId;
  style?: Style | Style[];
  children: string;
};

/** 軽量版のみ内部リンク。高画質版は通常テキスト（製本用）。 */
export function TocEntryText({ destinationId, style, children }: Props) {
  if (getPdfRenderQuality() !== "low") {
    return <Text style={style}>{children}</Text>;
  }

  const flatStyle = Array.isArray(style) ? Object.assign({}, ...style) : style ?? {};

  return (
    <Link
      src={`#${destinationId}`}
      style={{
        ...flatStyle,
        textDecoration: "none",
        color: (flatStyle.color as string | undefined) ?? TOC_LINK_TEXT_COLOR,
      }}
    >
      {children}
    </Link>
  );
}
