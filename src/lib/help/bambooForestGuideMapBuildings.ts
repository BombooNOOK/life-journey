export type ForestGuideMapBuildingId =
  | "guideStation"
  | "musicHall"
  | "kanteiHall"
  | "loghouse"
  | "handicraftShop";

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
  guideStation: {
    id: "guideStation",
    title: "森の案内所",
    body: "迷ったときに戻ってこられる場所です。森の案内図や、はじめての道しるべ、日記の書き方を確認できます。",
  },
  musicHall: {
    id: "musicHall",
    title: "森の小さな音楽堂",
    body: "BambooNOOKの森で暮らすうちに出会った音楽や、森の自然音を聴ける場所です。",
    href: "/help/music-hall?returnTo=%2Fhelp%2Fljd",
    linkLabel: "音楽堂を開く",
  },
  kanteiHall: {
    id: "kanteiHall",
    title: "鑑定のへや",
    body: "あなたが持つ数字を見つける場所です。生年月日とお名前から、無料の鑑定書を受け取れます。",
  },
  loghouse: {
    id: "loghouse",
    title: "ログハウス",
    body: "日記を書いたり、鑑定書や日記ブックを読み返したりする、あなたの拠点です。",
    href: "/orders",
    linkLabel: "ログハウスを開く",
  },
  handicraftShop: {
    id: "handicraftShop",
    title: "森のてしごと屋",
    body: "BambooNOOKのハンドメイド作品をのぞけるお店です。森の暮らしに合う品々を見つけてみてください。",
    href: "https://bamboonook.base.shop/categories/7349321",
    linkLabel: "てしごと屋を見る",
    external: true,
  },
};
