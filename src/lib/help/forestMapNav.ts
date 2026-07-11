import { FOREST_GUIDE_STATION_TITLE } from "@/lib/help/forestGuideStation";
import { FOREST_MAP_PAGE_PATH } from "@/lib/help/forestMapAssets";
import { LOG_HOUSE_NAV_LABEL } from "@/lib/journal/logHouseLabels";
import { resolveSafeReturnTo } from "@/lib/navigation/safeReturnTo";

export type ForestMapBackLink = {
  href: string;
  label: string;
};

/** 案内図へのリンク（戻り先を returnTo に載せる） */
export function buildForestMapHref(returnTo?: string | null): string {
  if (!returnTo?.trim()) return FOREST_MAP_PAGE_PATH;
  if (!returnTo.startsWith("/") || returnTo.startsWith("//")) return FOREST_MAP_PAGE_PATH;
  return `${FOREST_MAP_PAGE_PATH}?returnTo=${encodeURIComponent(returnTo)}`;
}

function backLabelForHref(href: string): string {
  const path = href.split("?")[0] ?? href;
  if (path === "/" || path === "") return "森の入口へ戻る";
  if (path === "/orders" || path.startsWith("/orders/")) {
    return `${LOG_HOUSE_NAV_LABEL}へ戻る`;
  }
  if (path === "/help/ljd" || path.startsWith("/help/ljd")) {
    return `${FOREST_GUIDE_STATION_TITLE}へ戻る`;
  }
  return "もといた場所へ戻る";
}

/** 案内図の「戻る」リンク（returnTo 優先、なければ森の入口） */
export function resolveForestMapBackLink(
  returnToRaw: string | null | undefined,
): ForestMapBackLink {
  const hasExplicitReturnTo =
    Boolean(returnToRaw?.trim()) &&
    returnToRaw!.startsWith("/") &&
    !returnToRaw!.startsWith("//");

  if (hasExplicitReturnTo) {
    const href = resolveSafeReturnTo(returnToRaw);
    return { href, label: backLabelForHref(href) };
  }

  return {
    href: "/",
    label: "森の入口へ戻る",
  };
}
