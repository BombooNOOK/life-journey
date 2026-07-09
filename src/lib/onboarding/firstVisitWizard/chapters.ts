import { FOREST_GUIDE_STATION_NUMEROLOGY_READING_HREF } from "@/lib/help/forestGuideStation";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";

export type FirstVisitChapterId = 1 | 2 | 3;

export type FirstVisitChapterDefinition = {
  id: FirstVisitChapterId;
  label: string;
  title: string;
  description: string;
  timeEstimate: string;
  reviewHref: string;
};

export const FIRST_VISIT_CHAPTERS: FirstVisitChapterDefinition[] = [
  {
    id: 1,
    label: "第1章",
    title: "住民登録と\nログハウスづくり",
    description: "住民票カードを作り、\nあなたのログハウスを用意します。",
    timeEstimate: "約2〜3分",
    reviewHref: "/help/ljd#loghouse",
  },
  {
    id: 2,
    label: "第2章",
    title: "鑑定のへやで鑑定書をつくる",
    description: "生年月日とお名前から、\nあなたの数字を見つけます。",
    timeEstimate: "約2〜3分",
    reviewHref: "/help/ljd#kantei",
  },
  {
    id: 3,
    label: "第3章",
    title: "はじめての日記を\n書いてみる",
    description: "写真と言葉で、\n今日の1ページを残してみます。",
    timeEstimate: "約1〜3分",
    reviewHref: "/help/ljd#writing",
  },
] as const;

/** 第2章の見返し：すうじの読み方（鑑定書の見方は reviewHref） */
export const FIRST_VISIT_CHAPTER_2_NUMEROLOGY_REVIEW_HREF =
  FOREST_GUIDE_STATION_NUMEROLOGY_READING_HREF;

export const FIRST_VISIT_CHAPTER_3_ENTRY_HREF = `/journal/with-companion?returnTo=${encodeURIComponent(FIRST_VISIT_ROUTES.pathGuide)}` as const;
