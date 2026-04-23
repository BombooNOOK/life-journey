/**
 * PDF の `resultTitle` などで、1 行に収まりにくい長さのときだけ
 * 読点「、」のあとで改行を入れる（`\n`）。
 * 短いタイトルはそのまま（レイアウトエンジンの折り返しに任せる）。
 */
const APPROX_ONE_LINE_MAX_CHARS = 20;

export function breakTitleAtCommaForPdf(title: string): string {
  const t = title.trim();
  if (!t.includes("、")) return t;
  if (t.length <= APPROX_ONE_LINE_MAX_CHARS) return t;

  const parts = t
    .split("、")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (parts.length < 2) return t;

  return parts.map((p, i) => (i < parts.length - 1 ? `${p}、` : p)).join("\n");
}
