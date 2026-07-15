/** 案内所 TOC「ログハウス」— スクショ注釈用 */

export const LJD_LOG_HOUSE_GUIDE_SHOT_SRC =
  "/images/ljd/guide-station/loghouse_guide_shot.jpg?v=3" as const;

export const LJD_LOG_HOUSE_GUIDE_SHOT_INTRINSIC = {
  widthPx: 503,
  heightPx: 1024,
} as const;

export const LJD_LOG_HOUSE_GUIDE_SECTION_SUMMARY = "拠点の室内をひと通りご案内" as const;

export type LjdLogHouseGuideMarkerId =
  | "residentCard"
  | "bookshelf"
  | "desk"
  | "todayResult"
  | "radio"
  | "rabbit"
  | "mailbox"
  | "goOut";

export type LjdLogHouseGuideMarker = {
  id: LjdLogHouseGuideMarkerId;
  /** 丸番号（表示用） */
  number: number;
  /** スクショ上の中心位置（%） */
  x: number;
  y: number;
  title: string;
  body: string;
};

/**
 * 番号位置は没入ログハウスのホットスポット付近。
 * 椅子は未役割のため含めない。
 */
export const LJD_LOG_HOUSE_GUIDE_MARKERS: LjdLogHouseGuideMarker[] = [
  {
    id: "residentCard",
    number: 1,
    x: 31.5,
    y: 16,
    title: "森の住民票カード",
    body: "タップすると、あなたの森の住民票カードを見ることができます。",
  },
  {
    id: "bookshelf",
    number: 2,
    x: 22,
    y: 30,
    title: "本棚",
    body: "タップすると棚の目の前の画面が開きます。本をタップしてカードから選び、鑑定書や日記ブックを読み返せます。背表紙から一覧も開けます。",
  },
  {
    id: "desk",
    number: 3,
    x: 72,
    y: 50,
    title: "机",
    body: "タップすると、ひとりで書くか・鑑定士といっしょに書くかを選べます。はじめての日記は鑑定士といっしょに書く流れになります。",
  },
  {
    id: "todayResult",
    number: 4,
    x: 80,
    y: 68,
    title: "今日の鑑定結果",
    body: "タップすると、今日のヒントや鑑定結果を見ることができます。",
  },
  {
    id: "radio",
    number: 5,
    x: 72,
    y: 82,
    title: "ラジカセ（森のラジカセ）",
    body: "タップすると森のラジカセが開きます。いまは操作の見た目だけお試しでき、音はこれから音楽堂で準備が進みます。",
  },
  {
    id: "rabbit",
    number: 6,
    x: 49,
    y: 50,
    title: "うさぎ（あなた自身）",
    body: "ログハウスにいるうさぎは、あなた自身の分身です。将来は、どんぐりで見た目を変えられるようにする予定です。",
  },
  {
    id: "mailbox",
    number: 7,
    x: 20,
    y: 89,
    title: "ポスト",
    body: "タップすると、ヤギの郵便屋さんからのお届けものを確認できます。",
  },
  {
    id: "goOut",
    number: 8,
    x: 50,
    y: 93.5,
    title: "靴（おでかけ）",
    body: "タップするとおでかけへ進み、お庭や森の案内図などへ出かけられます。",
  },
];
