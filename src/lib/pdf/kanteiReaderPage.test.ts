import { describe, expect, it } from "vitest";

import { PDF_TOC_ENTRIES } from "@/lib/pdf/pdfTocEntries";
import {
  buildKanteiPdfViewSrc,
  buildTocJumpIndexByDestination,
  clampPdfIndex,
  formatKanteiReaderPageIndicator,
  readerPageToPdfIndex,
  totalReaderPagesFromPdfCount,
} from "@/lib/pdf/kanteiReaderPage";

describe("kanteiReaderPage", () => {
  it("maps reader page numbers to pdf.js index", () => {
    expect(readerPageToPdfIndex(3)).toBe(3);
    expect(readerPageToPdfIndex(88)).toBe(88);
    expect(readerPageToPdfIndex(0)).toBe(0);
  });

  it("formats page indicator", () => {
    expect(formatKanteiReaderPageIndicator(0, 89)).toBe("表紙");
    expect(formatKanteiReaderPageIndicator(3, 89)).toBe("3 / 88");
  });

  it("computes reader total pages", () => {
    expect(totalReaderPagesFromPdfCount(89)).toBe(88);
  });

  it("clamps pdf index", () => {
    expect(clampPdfIndex(-1, 10)).toBe(0);
    expect(clampPdfIndex(99, 10)).toBe(9);
  });

  it("builds view src with page hash on blob url", () => {
    const src = buildKanteiPdfViewSrc("blob:http://127.0.0.1/abc-123", { pdfIndex: 3 });
    expect(src).toBe("blob:http://127.0.0.1/abc-123#page=4");
  });

  it("builds view src with named destination", () => {
    const src = buildKanteiPdfViewSrc("blob:http://127.0.0.1/abc-123", {
      destinationId: "toc-life-path",
    });
    expect(src).toBe("blob:http://127.0.0.1/abc-123#nameddest=toc-life-path");
  });
});
