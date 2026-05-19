/**
 * 第4章「この年大切にしたいこと」（`journal-invite-2-bg.png` + 生成テキスト）。
 * Canva レイヤー: `toshi_title` / `toshi_messe` / `toshi_thema` / `toshi_ishiki` / `toshi_tome`
 */
export type JournalPrioritiesCopy = {
  frameTitle: string;
  /** Canva `toshi_title` */
  title: string;
  /** Canva `toshi_messe` */
  message: string;
  /** Canva `toshi_thema` */
  themeLabel: string;
  /** Canva `toshi_ishiki` */
  awarenessLabel: string;
  /** Canva `toshi_tome` */
  selfWordLabel: string;
};

export const journalPrioritiesCopyJa: JournalPrioritiesCopy = {
  frameTitle: "大切にしたいこと",
  title: "この年大切にしたいこと",
  message: `この一年をどんなふうに過ごしていきたいか、
今の気持ちのままに、少しだけ言葉にしてみましょう。`,
  themeLabel: "今年の小さなテーマ",
  awarenessLabel: "意識したいこと",
  selfWordLabel: "自分に向けてひと言",
};

export function getJournalPrioritiesCopy(): JournalPrioritiesCopy {
  return journalPrioritiesCopyJa;
}
