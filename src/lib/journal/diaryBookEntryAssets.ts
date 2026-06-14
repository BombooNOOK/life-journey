import { companionTypeToTemplateSlug } from "@/lib/journal/coverAssets";

const CACHE_VERSION = "11";

function withCache(relativePath: string): string {
  return `${relativePath}?v=${CACHE_VERSION}`;
}

const ENTRY_PARTS_BASE = "/images/diary-book-entry";

export const DIARY_BOOK_ENTRY_NUMBER_BG = {
  day: withCache(`${ENTRY_PARTS_BASE}/diary-book-entry-number-bg-day.png`),
  month: withCache(`${ENTRY_PARTS_BASE}/diary-book-entry-number-bg-month.png`),
  year: withCache(`${ENTRY_PARTS_BASE}/diary-book-entry-number-bg-year.png`),
} as const;

export const DIARY_BOOK_ENTRY_DECO = {
  branch: withCache(`${ENTRY_PARTS_BASE}/diary-book-entry-deco-branch.png`),
  branch02: withCache(`${ENTRY_PARTS_BASE}/diary-book-entry-deco-branch-02.png`),
  branch03: withCache(`${ENTRY_PARTS_BASE}/diary-book-entry-deco-branch-03.png`),
  feather: withCache(`${ENTRY_PARTS_BASE}/diary-book-entry-deco-feather.png`),
  /** きおくの足あと見出し直後（カレンダー肉球とは別素材） */
  bodyPawprintAfterTitle: withCache(`${ENTRY_PARTS_BASE}/diary-book-entry-deco-pawprint.png`),
  photoLeaves: withCache(`${ENTRY_PARTS_BASE}/diary-book-entry-photo-leaves.png`),
  photoCameraIcon: withCache(`${ENTRY_PARTS_BASE}/diary-book-entry-photo-camera-icon.png`),
} as const;

export function diaryBookEntryCompanionImagePath(companionType: string): string {
  const slug = companionTypeToTemplateSlug(companionType);
  return withCache(`${ENTRY_PARTS_BASE}/diary-book-entry-companion-${slug}.png`);
}
