import { buildForestMapHref } from "@/lib/help/forestMapNav";
import { buildForestMusicHallHref } from "@/lib/help/forestMusicHallNav";
import { GARDEN_DESTINATION_ICON_SRC } from "@/lib/garden/gardenAssets";
import { GARDEN_PAGE_PATH } from "@/lib/garden/gardenCopy";
import { LOG_HOUSE_GO_OUT_PAGE_PATH } from "@/lib/loghouse/logHouseGoOutCopy";
import type { ForestBuildingId } from "@/lib/onboarding/firstVisitWizard/forestBuildingAssets";

export type LogHouseGoOutDestinationStatus = "active" | "comingSoon";

export type LogHouseGoOutDestinationId =
  | "guideStation"
  | "kanteiHall"
  | "garden"
  | "forestMap"
  | "musicHall"
  | "loghouse";

/** 建物イラスト、案内図、またはカスタム画像パス */
export type LogHouseGoOutDestinationIcon = ForestBuildingId | "forestMap" | { src: string };

export type LogHouseGoOutDestination = {
  id: LogHouseGoOutDestinationId;
  title: string;
  description: string;
  icon: LogHouseGoOutDestinationIcon;
  /** 固定パス、または鑑定のへや（ログイン状態で解決） */
  route: string | "kanteiHall";
  actionLabel: string;
  status: LogHouseGoOutDestinationStatus;
};

const GO_OUT_RETURN_TO = LOG_HOUSE_GO_OUT_PAGE_PATH;

/** おでかけページの行き先（追加時はここに足す） */
export const LOG_HOUSE_GO_OUT_DESTINATIONS: LogHouseGoOutDestination[] = [
  {
    id: "guideStation",
    title: "森の案内所",
    description: "使い方に迷ったときや、\nBambooNOOKの歩き方を見たいときに。",
    icon: "guideStation",
    route: "/help/ljd",
    actionLabel: "ここに行く",
    status: "active",
  },
  {
    id: "kanteiHall",
    title: "鑑定のへや",
    description: "あなたの数字や、\n鑑定書を見たいときに。",
    icon: "kanteiHall",
    route: "kanteiHall",
    actionLabel: "ここに行く",
    status: "active",
  },
  {
    id: "garden",
    title: "お庭に出る",
    description: "植物にお水をあげられる場所。\n少しだけ、森で過ごしてみましょう。",
    icon: { src: GARDEN_DESTINATION_ICON_SRC },
    route: GARDEN_PAGE_PATH,
    actionLabel: "ここに行く",
    status: "active",
  },
  {
    id: "forestMap",
    title: "森の地図",
    description: "森の中の場所を、\n地図から選びたいときに。",
    icon: "forestMap",
    route: buildForestMapHref(GO_OUT_RETURN_TO),
    actionLabel: "ここに行く",
    status: "active",
  },
  {
    id: "musicHall",
    title: "森の音楽堂",
    description: "音楽や森の音を\n楽しみたいときに。",
    icon: "musicHall",
    route: buildForestMusicHallHref(GO_OUT_RETURN_TO),
    actionLabel: "ここに行く",
    status: "active",
  },
  {
    id: "loghouse",
    title: "ログハウスに戻る",
    description: "自分のログハウスへ戻ります。",
    icon: "loghouse",
    route: "/orders",
    actionLabel: "戻る",
    status: "active",
  },
];
