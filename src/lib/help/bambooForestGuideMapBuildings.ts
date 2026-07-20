import { DONGURI_STALL_PAGE_PATH } from "@/lib/help/donguriStallCopy";
import type { ForestMapSpotId } from "@/lib/help/forestMapDestinations";

export type ForestGuideMapBuildingId = ForestMapSpotId;

export type ForestGuideMapBuildingInfo = {
  id: ForestGuideMapBuildingId;
  title: string;
  body: string;
  href?: string;
  linkLabel?: string;
  /** 外部ショップなど */
  external?: boolean;
};

export const FOREST_GUIDE_MAP_SECTION_HINT =
  "建物をタップすると、説明とそこへの行き先が開きます。" as const;

export const FOREST_GUIDE_MAP_BUILDINGS: Record<ForestGuideMapBuildingId, ForestGuideMapBuildingInfo> = {
  forestEntrance: {
    id: "forestEntrance",
    title: "森の入口",
    body: "BambooNOOKの森の入り口です。看板から森の案内図や各所へ進めます。",
    href: "/",
    linkLabel: "森の入口（トップ）へ",
  },
  loghouse: {
    id: "loghouse",
    title: "ログハウス",
    body: "日記を書いたり、鑑定書やあしあとブックを読み返したりする、あなたの拠点です。",
    href: "/orders",
    linkLabel: "ログハウスを開く",
  },
  forestTheater: {
    id: "forestTheater",
    title: "森のシアター",
    body: "準備中です。どうぶつたちのミニムービーや、どんぐりをもらえる広告を、自分から見に来られる場所になる予定です。",
  },
  forestShop: {
    id: "forestShop",
    title: "森のショップ",
    body: "準備中です。どんぐりでログハウスや着せ替えを楽しめる、クマ店長のお店になる予定です。",
  },
  donguriStall: {
    id: "donguriStall",
    title: "どんぐり売店",
    body: "森の入口すぐの小さな補給所です。どんぐりをふやしたいときに立ち寄れます（購入は現在準備中）。",
    href: `${DONGURI_STALL_PAGE_PATH}?returnTo=${encodeURIComponent("/help/ljd")}`,
    linkLabel: "どんぐり売店を開く",
  },
  musicHall: {
    id: "musicHall",
    title: "森の小さな音楽堂",
    body: "BambooNOOKの森で暮らすうちに出会った音楽や、森の自然音を聴ける場所です。",
    href: "/help/music-hall?returnTo=%2Fhelp%2Fljd",
    linkLabel: "音楽堂を開く",
  },
  handicraftShop: {
    id: "handicraftShop",
    title: "てしごと屋",
    body: "BambooNOOKのハンドメイド作品をのぞけるお店です。森の暮らしに合う品々を見つけてみてください。",
    href: "https://bamboonook.base.shop/categories/7349321",
    linkLabel: "てしごと屋を見る",
    external: true,
  },
  kanteiHall: {
    id: "kanteiHall",
    title: "鑑定のへや",
    body: "あなたが持つ数字を見つける場所です。生年月日とお名前から、無料の鑑定書を受け取れます。",
  },
  guideStation: {
    id: "guideStation",
    title: "森の案内所",
    body: "迷ったときに戻ってこられる場所です。森の案内図や、はじめての道しるべ、日記の書き方を確認できます。",
  },
};
