import type { DiaryDesignId } from "@/lib/journal/meta";

/** 画面上のプレビュー・入力補助用（軽量・ライト版など） */
export const diaryTemplateScreenImageMap: Record<DiaryDesignId, string> = {
  cute: "/images/diary-template-cute.png?v=2",
  cute_plain: "/images/diary-template-cute-plain.png?v=1",
  simple: "/images/diary-template-simple.png?v=4",
  simple_plain: "/images/diary-template-simple-plain.png?v=1",
};

/**
 * 印刷・PDF・製本取り込み用。
 * `public/images/diary-template-simple-print.png` に高解像度版を置き替えれば、ここだけ `?v=` を上げれば反映される。
 * 罫線なし版は `*-plain*.png` に同名構成で差し替え可能。
 * （現状のコードはプレビューが screen を参照。print パイプライン実装時にこのマップを使う）
 */
export const diaryTemplatePrintImageMap: Record<DiaryDesignId, string> = {
  cute: "/images/diary-template-cute.png?v=2",
  cute_plain: "/images/diary-template-cute-plain-print.png?v=1",
  simple: "/images/diary-template-simple-print.png?v=1",
  simple_plain: "/images/diary-template-simple-plain-print.png?v=1",
};
