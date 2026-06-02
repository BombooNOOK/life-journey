function isValidCalendarDayParam(day: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const [y, m, d] = day.split("-").map(Number);
  const probe = new Date(y, m - 1, d);
  return probe.getFullYear() === y && probe.getMonth() === m - 1 && probe.getDate() === d;
}

/**
 * 日記編集画面の `returnTo` 用。オープンリダイレクトを防ぎ、許可した戻り先のみ返す。
 * - `/orders/calendar` + 任意 `?day=YYYY-MM-DD`
 * - `/orders/bookshelf/diary/1970..2100` + 任意 `?p=1`
 */
export function parseSafeJournalReturnTo(raw: string | null): string | null {
  const diaryBook = parseSafeDiaryBookReturnTo(raw);
  if (diaryBook) return diaryBook;

  const bookshelf = parseSafeBookshelfDiaryReturnTo(raw);
  if (bookshelf) return bookshelf;

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
  if (pathPart !== "/orders/calendar") return null;

  if (qIndex < 0) return pathPart;

  const sp = new URLSearchParams(decoded.slice(qIndex + 1));
  const day = sp.get("day");
  if (day == null) return pathPart;
  if (!isValidCalendarDayParam(day)) return pathPart;

  return `${pathPart}?day=${day}`;
}

/**
 * 日記編集画面の `returnTo` 用。DiaryBook 読書画面のみ許可。
 * 形式: `/orders/bookshelf/diary-book/{bookId}` + 任意で `?p=1`（1始まりページ）
 */
export function parseSafeDiaryBookReturnTo(raw: string | null): string | null {
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

  const m = /^\/orders\/bookshelf\/diary-book\/([a-z0-9]{10,64})$/i.exec(pathPart);
  if (!m) return null;

  if (qIndex < 0) return pathPart;

  const sp = new URLSearchParams(decoded.slice(qIndex + 1));
  const p = sp.get("p");
  if (p == null) return pathPart;
  if (!/^\d{1,5}$/.test(p)) return pathPart;
  const pageOneBased = parseInt(p, 10);
  if (!Number.isFinite(pageOneBased) || pageOneBased < 1) return pathPart;

  return `${pathPart}?p=${pageOneBased}`;
}

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
