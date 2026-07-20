/** どんぐり売店（森の入口付近の小さな屋台） */

export const DONGURI_STALL_PAGE_PATH = "/help/donguri-stall" as const;

export const DONGURI_STALL_PAGE_TITLE = "どんぐり売店" as const;

export const DONGURI_STALL_PAGE_DESCRIPTION =
  "BambooNOOKの森のどんぐり売店です。どんぐりをふやしたいときの補給所です（現在準備中）。" as const;

/** 売店ページの挿絵（案内図本体には焼き込まない） */
export const DONGURI_STALL_ILLUSTRATION_SRC =
  "/images/ljd/donguri/donguri_stall.png?v=1" as const;

export const DONGURI_STALL_INTRO_PARAGRAPHS = [
  "BambooNOOKの森では、ヤギさん郵便やお祝いのおとどけでもどんぐりを受け取れます。",
  "「広告を見るより、少し応援したい」「今すぐ森にあしあとを残したい」",
  "そんな時は、ここからどんぐりをふやせます。",
] as const;

export const DONGURI_STALL_PREPARING_NOTICE =
  "現在準備中です。スマホアプリ版でのご案内に向けて準備しています。" as const;

export const DONGURI_STALL_OFFERS = [
  {
    id: "forest-delivery",
    title: "森の定期便",
    detail: "毎月どんぐり100こ",
    status: "現在準備中",
  },
  {
    id: "acorns-50",
    title: "どんぐり50こ",
    detail: "200円予定",
    status: "現在準備中",
  },
] as const;
