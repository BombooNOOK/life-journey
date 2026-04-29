/**
 * 日記編集画面の `returnTo` 用。オープンリダイレクトを防ぎ、許可した本棚のプレビュー URL のみ返す。
 * 形式: `/orders/bookshelf/diary/1970..2100` + 任意で `?p=1`（1始まりページ）
 */
export function parseSafeBookshelfDiaryReturnTo(raw: string | null): string | null {
  if (raw == null || typeof raw !== "string") return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw.trim());
  } catch {
    return null;
  }
  if (!decoded.startsWith("/") || decoded.includes("//")) return null;

  const qIndex = decoded.indexOf("?");
  const pathPart = qIndex >= 0 ? decoded.slice(0, qIndex) : decoded;

  const m = /^\/orders\/bookshelf\/diary\/(\d{4})$/.exec(pathPart);
  if (!m) return null;
  const yearNum = Number(m[1]);
  if (!Number.isFinite(yearNum) || yearNum < 1970 || yearNum > 2100) return null;

  if (qIndex < 0) return pathPart;

  const sp = new URLSearchParams(decoded.slice(qIndex + 1));
  const p = sp.get("p");
  if (p == null) return pathPart;
  if (!/^\d{1,5}$/.test(p)) return pathPart;
  const pageOneBased = parseInt(p, 10);
  if (!Number.isFinite(pageOneBased) || pageOneBased < 1) return pathPart;

  return `${pathPart}?p=${pageOneBased}`;
}
