import { Document } from "@react-pdf/renderer";

import type { OrderPayload } from "@/lib/order/types";

import { ReportPdfPages } from "./ReportPdfPages";
import type { PdfRenderConfig } from "./pdfRenderConfig";

interface Props {
  order: OrderPayload;
  renderConfig?: PdfRenderConfig;
}

export function ReportDocument({ order, renderConfig }: Props) {
  return (
    <Document>
      <ReportPdfPages order={order} renderConfig={renderConfig} segment="full" />
    </Document>
  );
}
