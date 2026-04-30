import { createContext, useContext } from "react";

import type { PdfRenderQuality } from "./pdfRenderConfig";

const PdfQualityContext = createContext<PdfRenderQuality>("high");

export function PdfQualityProvider({
  quality,
  children,
}: {
  quality: PdfRenderQuality;
  children: React.ReactNode;
}) {
  return <PdfQualityContext.Provider value={quality}>{children}</PdfQualityContext.Provider>;
}

export function usePdfRenderQuality(): PdfRenderQuality {
  return useContext(PdfQualityContext);
}
