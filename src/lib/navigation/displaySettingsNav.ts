import { resolveSafeReturnTo } from "@/lib/navigation/safeReturnTo";
import { LOG_HOUSE_SHORT_LABEL } from "@/lib/journal/logHouseLabels";

export function buildDisplaySettingsPath(returnTo?: string | null): string {
  if (!returnTo?.trim()) return "/orders/settings/display";
  const safe = resolveSafeReturnTo(returnTo);
  return `/orders/settings/display?returnTo=${encodeURIComponent(safe)}`;
}

export function buildDisplaySettingsHref(returnTo?: string | null): string {
  if (returnTo?.trim()) return buildDisplaySettingsPath(returnTo);
  if (typeof window !== "undefined") {
    return buildDisplaySettingsPath(`${window.location.pathname}${window.location.search}`);
  }
  return "/orders/settings/display";
}

export function parseDisplaySettingsReturnTo(raw: string | null | undefined): string {
  return resolveSafeReturnTo(raw);
}

export function displaySettingsBackLabel(backHref: string): string {
  if (backHref === "/orders") return LOG_HOUSE_SHORT_LABEL;
  return "前の画面へ戻る";
}
