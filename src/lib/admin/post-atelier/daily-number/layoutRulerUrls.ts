import type { DailyNumberLayoutSlide } from "./layoutDebug";
import { DAILY_NUMBER_LAYOUT_SLIDES } from "./layoutDebug";

export const DAILY_NUMBER_LAYOUT_RULER_PATH = "/preview/post-atelier/daily-number-layout";

export function dailyNumberEditPath(draftId: string): string {
  return `/admin/post-atelier/daily-number/${draftId}`;
}

/** カルーセル枚目（1〜8）→ 定規スライド ID */
export function carouselIndexToLayoutSlide(index: number): DailyNumberLayoutSlide | null {
  const map: Record<number, DailyNumberLayoutSlide> = {
    1: "cover",
    2: "explain",
    3: "personal-01",
    4: "personal-02",
    5: "personal-03",
    6: "personal-04",
    7: "personal-05",
    8: "personal-06",
  };
  return map[index] ?? null;
}

export function parseLayoutRulerSlide(raw: string | null | undefined): DailyNumberLayoutSlide | null {
  const value = raw?.trim();
  if (!value) return null;
  return DAILY_NUMBER_LAYOUT_SLIDES.some((s) => s.id === value)
    ? (value as DailyNumberLayoutSlide)
    : null;
}

export function buildDailyNumberLayoutRulerHref(input?: {
  returnTo?: string;
  slide?: DailyNumberLayoutSlide;
}): string {
  const params = new URLSearchParams();
  if (input?.returnTo?.trim()) {
    params.set("returnTo", input.returnTo.trim());
  }
  if (input?.slide) {
    params.set("slide", input.slide);
  }
  const query = params.toString();
  return query ? `${DAILY_NUMBER_LAYOUT_RULER_PATH}?${query}` : DAILY_NUMBER_LAYOUT_RULER_PATH;
}

export function parseLayoutRulerReturnTo(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  if (!value.startsWith("/admin/post-atelier/daily-number/")) return null;
  return value;
}
