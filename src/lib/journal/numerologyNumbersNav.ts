import { NUMEROLOGY_NUMBER_MEANINGS_PATH } from "@/lib/journal/journalDiaryNumbersHelpCopy";
import { LOG_HOUSE_RETURN_TO_LABEL } from "@/lib/journal/logHouseLabels";

const ALLOWED_RETURN_PATHS = new Set([
  "/journal/preview",
  "/orders/list",
  "/orders/calendar",
  "/orders",
]);

/** 数字の意味ページの `returnTo`（同一オリジン・許可パスのみ） */
export function parseSafeNumerologyNumbersReturnTo(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== "string") return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw.trim());
  } catch {
    return null;
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//")) return null;

  const qIndex = decoded.indexOf("?");
  const pathPart = qIndex >= 0 ? decoded.slice(0, qIndex) : decoded;
  if (!ALLOWED_RETURN_PATHS.has(pathPart)) return null;

  return decoded;
}

export type PersonalDiaryNumbersQuery = {
  today: number;
  month: number;
  year: number;
};

function parseDiaryNumberQueryValue(raw: string | null | undefined): number | null {
  const value = Number.parseInt(String(raw ?? "").trim(), 10);
  if (!Number.isFinite(value) || value < 1 || value > 9) return null;
  return value;
}

/** あしあとプレビューから渡す today / month / year（1〜9） */
export function parsePersonalDiaryNumbersFromSearchParams(input: {
  today?: string | null;
  month?: string | null;
  year?: string | null;
}): PersonalDiaryNumbersQuery | null {
  const today = parseDiaryNumberQueryValue(input.today);
  const month = parseDiaryNumberQueryValue(input.month);
  const year = parseDiaryNumberQueryValue(input.year);
  if (today == null || month == null || year == null) return null;
  return { today, month, year };
}

export function numerologyNumberMeaningsHref(
  returnTo?: string | null,
  diaryNumbers?: PersonalDiaryNumbersQuery | null,
): string {
  const qs = new URLSearchParams();
  const safe = parseSafeNumerologyNumbersReturnTo(returnTo);
  if (safe) qs.set("returnTo", safe);
  if (diaryNumbers) {
    qs.set("today", String(diaryNumbers.today));
    qs.set("month", String(diaryNumbers.month));
    qs.set("year", String(diaryNumbers.year));
  }
  const query = qs.toString();
  return query ? `${NUMEROLOGY_NUMBER_MEANINGS_PATH}?${query}` : NUMEROLOGY_NUMBER_MEANINGS_PATH;
}

export function numerologyNumbersBackLink(returnTo: string | null): {
  href: string;
  label: string;
} {
  if (!returnTo) {
    return { href: "/orders/calendar", label: "カレンダーへ戻る" };
  }
  if (returnTo.startsWith("/journal/preview")) {
    return { href: returnTo, label: "あしあとプレビューへ戻る" };
  }
  if (returnTo.startsWith("/orders/list")) {
    return { href: returnTo, label: "あしあと帳へ戻る" };
  }
  if (returnTo.startsWith("/orders/calendar")) {
    return { href: returnTo, label: "カレンダーへ戻る" };
  }
  if (returnTo === "/orders") {
    return { href: returnTo, label: LOG_HOUSE_RETURN_TO_LABEL };
  }
  return { href: returnTo, label: "前の画面へ戻る" };
}
