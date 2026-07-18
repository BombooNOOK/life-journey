import { FOREST_GUIDE_STATION_TITLE } from "@/lib/help/forestGuideStation";
import { LOG_HOUSE_RETURN_TO_LABEL } from "@/lib/journal/logHouseLabels";
import { resolveSafeReturnTo } from "@/lib/navigation/safeReturnTo";

export const FOREST_GUIDE_STATION_PATH = "/help/ljd" as const;

export type ForestGuideStationBackLink = {
  href: string;
  label: string;
};

/** 案内所へのリンク（戻り先を returnTo に載せる） */
export function buildForestGuideStationHref(options?: {
  returnTo?: string | null;
  hash?: string | null;
}): string {
  const returnTo = options?.returnTo?.trim();
  const hash = options?.hash?.trim()?.replace(/^#/, "") ?? "";
  const base =
    returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? `${FOREST_GUIDE_STATION_PATH}?returnTo=${encodeURIComponent(returnTo)}`
      : FOREST_GUIDE_STATION_PATH;
  return hash ? `${base}#${hash}` : base;
}

function backLabelForHref(href: string): string {
  const path = href.split("?")[0] ?? href;
  if (path === "/orders") return "ログハウスの案内に戻る";
  if (path.startsWith("/preview/loghouse-tour")) return "案内プレビューに戻る";
  if (path.startsWith("/preview/loghouse-room")) return "プレビューへ戻る";
  if (path === "/orders" || path.startsWith("/orders/")) return LOG_HOUSE_RETURN_TO_LABEL;
  return "もといた場所に戻る";
}

/** 案内所の「戻る」リンク（returnTo 優先） */
export function resolveForestGuideStationBackLink(
  returnToRaw: string | null | undefined,
): ForestGuideStationBackLink | null {
  const hasExplicitReturnTo =
    Boolean(returnToRaw?.trim()) &&
    returnToRaw!.startsWith("/") &&
    !returnToRaw!.startsWith("//");

  if (!hasExplicitReturnTo) return null;

  const href = resolveSafeReturnTo(returnToRaw);
  return { href, label: backLabelForHref(href) };
}

export { FOREST_GUIDE_STATION_TITLE };
