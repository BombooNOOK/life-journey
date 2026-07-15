import { FOREST_GUIDE_STATION_TITLE } from "@/lib/help/forestGuideStation";
import { FOREST_MUSIC_HALL_BACK_HREF } from "@/lib/help/forestMusicHallCatalog";
import { LOG_HOUSE_BACK_TO_LABEL } from "@/lib/journal/logHouseLabels";
import { resolveSafeReturnTo } from "@/lib/navigation/safeReturnTo";

export const FOREST_MUSIC_HALL_PATH = "/help/music-hall" as const;

export type ForestMusicHallBackLink = {
  href: string;
  label: string;
};

/** 音楽堂へのリンク（戻り先を returnTo に載せる） */
export function buildForestMusicHallHref(returnTo?: string | null): string {
  if (!returnTo?.trim()) return FOREST_MUSIC_HALL_PATH;
  if (!returnTo.startsWith("/") || returnTo.startsWith("//")) return FOREST_MUSIC_HALL_PATH;
  return `${FOREST_MUSIC_HALL_PATH}?returnTo=${encodeURIComponent(returnTo)}`;
}

function backLabelForHref(href: string): string {
  const path = href.split("?")[0] ?? href;
  if (path === "/orders" || path.startsWith("/orders/")) {
    return LOG_HOUSE_BACK_TO_LABEL;
  }
  if (path === "/help/ljd" || path.startsWith("/help/ljd")) {
    return `${FOREST_GUIDE_STATION_TITLE}へ戻る`;
  }
  if (path.startsWith("/preview/loghouse-room")) {
    return "プレビューへ戻る";
  }
  return LOG_HOUSE_BACK_TO_LABEL;
}

/** 音楽堂の「戻る」リンク（returnTo 優先、なければ案内所） */
export function resolveForestMusicHallBackLink(
  returnToRaw: string | null | undefined,
): ForestMusicHallBackLink {
  const hasExplicitReturnTo =
    Boolean(returnToRaw?.trim()) &&
    returnToRaw!.startsWith("/") &&
    !returnToRaw!.startsWith("//");

  if (hasExplicitReturnTo) {
    const href = resolveSafeReturnTo(returnToRaw);
    return { href, label: backLabelForHref(href) };
  }

  return {
    href: FOREST_MUSIC_HALL_BACK_HREF,
    label: `${FOREST_GUIDE_STATION_TITLE}へ`,
  };
}
