/** ガイド原稿の行内マークアップ（`pdfCoreNumberGuideCopy` 用） */
export type ManuscriptTextSegment = { text: string; italic?: boolean };

/**
 * - 行頭 `~` … 行全体を斜体
 * - `*…*` … インライン斜体（例: `*もっとできるようになりたい、*とか。`）
 */
export function parseManuscriptLineMarkup(line: string): ManuscriptTextSegment[] {
  if (line.startsWith("~")) {
    return [{ text: line.slice(1), italic: true }];
  }

  const segments: ManuscriptTextSegment[] = [];
  const re = /\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) {
      segments.push({ text: line.slice(last, m.index) });
    }
    segments.push({ text: m[1], italic: true });
    last = m.index + m[0].length;
  }
  if (last < line.length) {
    segments.push({ text: line.slice(last) });
  }
  return segments.length > 0 ? segments : [{ text: line }];
}
