function isValidCalendarDayParam(day: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const [y, m, d] = day.split("-").map(Number);
  const probe = new Date(y, m - 1, d);
  return probe.getFullYear() === y && probe.getMonth() === m - 1 && probe.getDate() === d;
}

function decodeSafePath(raw: string | null): string | null {
  if (raw == null || typeof raw !== "string") return null;
  try {
    const decoded = decodeURIComponent(raw.trim());
    if (!decoded.startsWith("/") || decoded.includes("//")) return null;
    return decoded;
  } catch {
    return null;
  }
}

const ENTRY_ID_PATTERN = /^[a-z0-9]{10,64}$/i;
const PROFILE_ID_PATTERN = /^[a-z0-9]{10,64}$/i;

/**
 * 日記編集画面の `returnTo` 用。オープンリダイレクトを防ぎ、許可した戻り先のみ返す。
 */
export function parseSafeJournalReturnTo(raw: string | null): string | null {
  const diaryBook = parseSafeDiaryBookReturnTo(raw);
  if (diaryBook) return diaryBook;

  const bookshelf = parseSafeBookshelfDiaryReturnTo(raw);
  if (bookshelf) return bookshelf;

  const preview = parseSafeJournalPreviewReturnTo(raw);
  if (preview) return preview;

  const list = parseSafeJournalListReturnTo(raw);
  if (list) return list;

  const bookshelfHome = parseSafeBookshelfHomeReturnTo(raw);
  if (bookshelfHome) return bookshelfHome;

  const decoded = decodeSafePath(raw);
  if (!decoded) return null;

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

/** `/journal/preview?entry=…` など、日記プレビューへの戻り先 */
export function parseSafeJournalPreviewReturnTo(raw: string | null): string | null {
  const decoded = decodeSafePath(raw);
  if (!decoded) return null;

  const qIndex = decoded.indexOf("?");
  const pathPart = qIndex >= 0 ? decoded.slice(0, qIndex) : decoded;
  if (pathPart !== "/journal/preview") return null;
  if (qIndex < 0) return pathPart;

  const sp = new URLSearchParams(decoded.slice(qIndex + 1));
  const entry = sp.get("entry")?.trim();
  if (!entry || !ENTRY_ID_PATTERN.test(entry)) return null;

  const rebuilt = new URLSearchParams({ entry, pv: "3" });
  const theme = sp.get("theme")?.trim();
  if (theme && /^[a-z0-9_-]{1,40}$/i.test(theme)) {
    rebuilt.set("theme", theme);
  }
  const profile = sp.get("profile")?.trim();
  if (profile && PROFILE_ID_PATTERN.test(profile)) {
    rebuilt.set("profile", profile);
  }
  const nestedReturnTo = sp.get("returnTo");
  if (nestedReturnTo) {
    const safeNested = parseSafeJournalReturnTo(nestedReturnTo);
    if (safeNested) rebuilt.set("returnTo", safeNested);
  }

  return `/journal/preview?${rebuilt.toString()}`;
}

/** `/orders/list?month=YYYY-MM` 日記一覧への戻り先 */
export function parseSafeJournalListReturnTo(raw: string | null): string | null {
  const decoded = decodeSafePath(raw);
  if (!decoded) return null;

  const qIndex = decoded.indexOf("?");
  const pathPart = qIndex >= 0 ? decoded.slice(0, qIndex) : decoded;
  if (pathPart !== "/orders/list") return null;
  if (qIndex < 0) return pathPart;

  const sp = new URLSearchParams(decoded.slice(qIndex + 1));
  const month = sp.get("month")?.trim();
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return pathPart;

  const [y, m] = month.split("-").map(Number);
  const probe = new Date(y, m - 1, 1);
  if (probe.getFullYear() !== y || probe.getMonth() !== m - 1) return pathPart;

  return `/orders/list?month=${month}`;
}

/** 本棚トップ `/orders/bookshelf` */
export function parseSafeBookshelfHomeReturnTo(raw: string | null): string | null {
  const decoded = decodeSafePath(raw);
  if (!decoded) return null;
  const qIndex = decoded.indexOf("?");
  const pathPart = qIndex >= 0 ? decoded.slice(0, qIndex) : decoded;
  if (pathPart !== "/orders/bookshelf") return null;
  if (qIndex < 0) return pathPart;
  return null;
}

const DIARY_BOOK_EDIT_SUBPATHS = new Set([
  "edit-includes",
  "edit-period",
  "edit-tags",
]);

/**
 * 日記編集画面の `returnTo` 用。DiaryBook 読書画面・編集画面を許可。
 * 形式:
 * - `/orders/bookshelf/diary-book/{bookId}` + 任意で `?p=1`（1始まりページ）
 * - `/orders/bookshelf/diary-book/{bookId}/edit-includes|edit-period|edit-tags`
 */
export function parseSafeDiaryBookReturnTo(raw: string | null): string | null {
  const decoded = decodeSafePath(raw);
  if (!decoded) return null;

  const qIndex = decoded.indexOf("?");
  const pathPart = qIndex >= 0 ? decoded.slice(0, qIndex) : decoded;

  const m =
    /^\/orders\/bookshelf\/diary-book\/([a-z0-9]{10,64})(?:\/(edit-includes|edit-period|edit-tags))?$/i.exec(
      pathPart,
    );
  if (!m) return null;
  const bookId = m[1];
  const sub = m[2]?.toLowerCase() ?? null;
  if (sub && !DIARY_BOOK_EDIT_SUBPATHS.has(sub)) return null;

  const basePath = sub
    ? `/orders/bookshelf/diary-book/${bookId}/${sub}`
    : `/orders/bookshelf/diary-book/${bookId}`;

  if (qIndex < 0) return basePath;
  if (sub) return basePath;

  const sp = new URLSearchParams(decoded.slice(qIndex + 1));
  const p = sp.get("p");
  if (p == null) return basePath;
  if (!/^\d{1,5}$/.test(p)) return basePath;
  const pageOneBased = parseInt(p, 10);
  if (!Number.isFinite(pageOneBased) || pageOneBased < 1) return basePath;

  return `${basePath}?p=${pageOneBased}`;
}

/**
 * 日記編集画面の `returnTo` 用。オープンリダイレクトを防ぎ、許可した本棚のプレビュー URL のみ返す。
 * 形式: `/orders/bookshelf/diary/1970..2100` + 任意で `?p=1`（1始まりページ）
 */
export function parseSafeBookshelfDiaryReturnTo(raw: string | null): string | null {
  const decoded = decodeSafePath(raw);
  if (!decoded) return null;

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
