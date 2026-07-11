import { FOREST_MAP_PAGE_PATH } from "@/lib/help/forestMapAssets";
import { buildForestMusicHallHref } from "@/lib/help/forestMusicHallNav";

export type ForestMapSpotId =
  | "forestEntrance"
  | "loghouse"
  | "forestTheater"
  | "forestShop"
  | "musicHall"
  | "handicraftShop"
  | "kanteiHall"
  | "guideStation";

export type ForestMapDestination = {
  id: ForestMapSpotId;
  label: string;
  /** 固定の行き先。鑑定のへやは実行時に解決 */
  href?: string;
  external?: boolean;
  /** 鑑定のへやなど、タップ時に API で href を決める */
  resolve?: "kanteiHall";
  /** ページ未公開など：タップで案内のみ */
  comingSoonMessage?: string;
};

/** 単独案内図：タップで直接移動する行き先 */
export const FOREST_MAP_DESTINATIONS: Record<ForestMapSpotId, ForestMapDestination> = {
  forestEntrance: {
    id: "forestEntrance",
    label: "森の入口",
    href: "/",
  },
  loghouse: {
    id: "loghouse",
    label: "ログハウス",
    href: "/orders",
  },
  forestTheater: {
    id: "forestTheater",
    label: "森のシアター",
    comingSoonMessage:
      "森のシアターは準備中です。どうぶつたちのミニムービーや、どんぐりをもらえる広告を、自分から見に来られる場所になる予定です。",
  },
  forestShop: {
    id: "forestShop",
    label: "森のショップ",
    comingSoonMessage:
      "森のショップは準備中です。どんぐりでログハウスや着せ替えを楽しめる、クマ店長のお店になる予定です。",
  },
  musicHall: {
    id: "musicHall",
    label: "森の小さな音楽堂",
    href: buildForestMusicHallHref(FOREST_MAP_PAGE_PATH),
  },
  handicraftShop: {
    id: "handicraftShop",
    label: "てしごと屋",
    href: "https://bamboonook.base.shop/categories/7349321",
    external: true,
  },
  kanteiHall: {
    id: "kanteiHall",
    label: "鑑定のへや",
    resolve: "kanteiHall",
  },
  guideStation: {
    id: "guideStation",
    label: "森の案内所",
    href: "/help/ljd",
  },
};
