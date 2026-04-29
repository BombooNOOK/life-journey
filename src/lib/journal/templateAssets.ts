import type { DiaryDesignId } from "@/lib/journal/meta";

/** 画面上のプレビュー・入力補助用（軽量・ライト版など） */
export const diaryTemplateScreenImageMap: Record<DiaryDesignId, string> = {
  cute: "/images/diary-template-cute.png?v=2",
  simple: "/images/diary-template-simple.png?v=4",
};

/**
 * 印刷・PDF・製本取り込み用。
 * `public/images/diary-template-simple-print.png` に高解像度版を置き替えれば、ここだけ `?v=` を上げれば反映される。
 * （現状のコードはプレビューが screen を参照。print パイプライン実装時にこのマップを使う）
 */
export const diaryTemplatePrintImageMap: Record<DiaryDesignId, string> = {
  cute: "/images/diary-template-cute.png?v=2",
  simple: "/images/diary-template-simple-print.png?v=1",
};
