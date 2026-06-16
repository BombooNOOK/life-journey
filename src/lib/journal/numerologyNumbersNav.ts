import { NUMEROLOGY_NUMBER_MEANINGS_PATH } from "@/lib/journal/journalDiaryNumbersHelpCopy";

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

export function numerologyNumberMeaningsHref(returnTo?: string | null): string {
  const safe = parseSafeNumerologyNumbersReturnTo(returnTo);
  if (!safe) return NUMEROLOGY_NUMBER_MEANINGS_PATH;
  const qs = new URLSearchParams({ returnTo: safe });
  return `${NUMEROLOGY_NUMBER_MEANINGS_PATH}?${qs.toString()}`;
}

export function numerologyNumbersBackLink(returnTo: string | null): {
  href: string;
  label: string;
} {
  if (!returnTo) {
    return { href: "/orders/calendar", label: "カレンダーへ戻る" };
  }
  if (returnTo.startsWith("/journal/preview")) {
    return { href: returnTo, label: "日記プレビューへ戻る" };
  }
  if (returnTo.startsWith("/orders/list")) {
    return { href: returnTo, label: "日記一覧へ戻る" };
  }
  if (returnTo.startsWith("/orders/calendar")) {
    return { href: returnTo, label: "カレンダーへ戻る" };
  }
  if (returnTo === "/orders") {
    return { href: returnTo, label: "マイページへ戻る" };
  }
  return { href: returnTo, label: "前の画面へ戻る" };
}
