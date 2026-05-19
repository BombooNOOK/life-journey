import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFRef,
  PDFString,
  type PDFObject,
} from "pdf-lib";

function decodePdfName(value: PDFObject): string | null {
  if (value instanceof PDFString || value instanceof PDFHexString) {
    return value.decodeText();
  }
  if (value instanceof PDFName) {
    const s = value.toString();
    return s.startsWith("/") ? s.slice(1) : s;
  }
  return null;
}

function pageIndexForRef(pdf: PDFDocument, pageRef: PDFRef): number | null {
  const pages = pdf.getPages();
  for (let i = 0; i < pages.length; i++) {
    if (pages[i].ref.toString() === pageRef.toString()) return i;
  }
  return null;
}

function resolveDestToPageIndex(pdf: PDFDocument, dest: PDFObject): number | null {
  const resolved = dest instanceof PDFRef ? pdf.context.lookup(dest) : dest;
  if (resolved instanceof PDFArray) {
    const pageRef = resolved.get(0);
    if (pageRef instanceof PDFRef) return pageIndexForRef(pdf, pageRef);
    return null;
  }
  if (resolved instanceof PDFDict) {
    const d = resolved.get(PDFName.of("D"));
    if (d) return resolveDestToPageIndex(pdf, d);
  }
  return null;
}

function collectNamesArray(
  pdf: PDFDocument,
  namesArray: PDFArray,
  out: Map<string, number>,
): void {
  for (let i = 0; i + 1 < namesArray.size(); i += 2) {
    const name = decodePdfName(namesArray.get(i));
    const dest = namesArray.get(i + 1);
    if (!name || !dest) continue;
    const pageIndex = resolveDestToPageIndex(pdf, dest);
    if (pageIndex != null) out.set(name, pageIndex);
  }
}

function walkDestsNode(pdf: PDFDocument, node: PDFObject, out: Map<string, number>): void {
  const dict = node instanceof PDFRef ? pdf.context.lookup(node) : node;
  if (!(dict instanceof PDFDict)) return;

  const names = dict.get(PDFName.of("Names"));
  if (names instanceof PDFArray) {
    collectNamesArray(pdf, names, out);
  }

  const kids = dict.get(PDFName.of("Kids"));
  if (kids instanceof PDFArray) {
    for (let i = 0; i < kids.size(); i++) {
      walkDestsNode(pdf, kids.get(i), out);
    }
  }
}

/** react-pdf が付与した Named Destination（id）→ 0-based ページ番号 */
export function extractNamedDestinationPageIndices(pdfBytes: Uint8Array): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  return PDFDocument.load(pdfBytes).then((pdf) => {
    const namesRef = pdf.catalog.get(PDFName.of("Names"));
    if (!namesRef) return out;
    const namesDict = pdf.context.lookup(namesRef);
    if (!(namesDict instanceof PDFDict)) return out;
    const destsRef = namesDict.get(PDFName.of("Dests"));
    if (!destsRef) return out;
    walkDestsNode(pdf, destsRef, out);
    return out;
  });
}

function parseGoToDestinationName(pdf: PDFDocument, d: PDFObject | undefined): string | null {
  if (!d) return null;
  if (d instanceof PDFString || d instanceof PDFHexString || d instanceof PDFName) {
    return decodePdfName(d);
  }
  if (d instanceof PDFRef) {
    const resolved = pdf.context.lookup(d);
    if (resolved instanceof PDFString || resolved instanceof PDFHexString || resolved instanceof PDFName) {
      return decodePdfName(resolved);
    }
  }
  return null;
}

function explicitDestArray(pdf: PDFDocument, pageIndex: number): PDFArray {
  const page = pdf.getPages()[pageIndex];
  return pdf.context.obj([page.ref, PDFName.of("XYZ"), null, null, null]);
}

/**
 * pdf-lib 結合後は /Names が欠落し、GoTo の名前参照だけが残る。各リンクをページ参照に書き換える。
 */
export function repairGoToNamedLinks(pdf: PDFDocument, destinationToPageIndex: Map<string, number>): void {
  for (const page of pdf.getPages()) {
    const annotsRef = page.node.Annots();
    if (!annotsRef) continue;
    const annots = pdf.context.lookup(annotsRef);
    if (!(annots instanceof PDFArray)) continue;

    for (let i = 0; i < annots.size(); i++) {
      const annotRef = annots.get(i);
      const annot = pdf.context.lookup(annotRef);
      if (!(annot instanceof PDFDict)) continue;

      const actionRef = annot.get(PDFName.of("A"));
      if (!actionRef) continue;
      const action = pdf.context.lookup(actionRef);
      if (!(action instanceof PDFDict)) continue;
      if (action.get(PDFName.of("S"))?.toString() !== "/GoTo") continue;

      const destName = parseGoToDestinationName(pdf, action.get(PDFName.of("D")));
      if (!destName) continue;

      const pageIndex = destinationToPageIndex.get(destName);
      if (pageIndex == null) continue;

      action.set(PDFName.of("D"), explicitDestArray(pdf, pageIndex));
    }
  }
}

export async function buildMergedNamedDestinationMap(
  segments: { pdfBytes: Uint8Array; pageOffset: number }[],
): Promise<Map<string, number>> {
  const merged = new Map<string, number>();
  for (const { pdfBytes, pageOffset } of segments) {
    const local = await extractNamedDestinationPageIndices(pdfBytes);
    for (const [name, pageIndex] of local) {
      merged.set(name, pageIndex + pageOffset);
    }
  }
  return merged;
}

export async function repairMergedPdfInternalLinks(
  mergedBytes: Uint8Array,
  destinationToPageIndex: Map<string, number>,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(mergedBytes);
  repairGoToNamedLinks(pdf, destinationToPageIndex);
  return pdf.save();
}
