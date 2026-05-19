/**
 * 第4章「この年を振り返って」（`journal-invite-3-bg.png` + 生成テキスト）。
 * Canva: `huri_title` / `huri_messe` / `huri01`〜`huri04`
 */
export type JournalRetrospectCopy = {
  frameTitle: string;
  /** Canva `huri_title` */
  title: string;
  /** Canva `huri_messe` */
  message: string;
  /** Canva `huri01` */
  themeLabel: string;
  /** Canva `huri02` */
  awarenessLabel: string;
  /** Canva `huri03` */
  impressionLabel: string;
  /** Canva `huri04` */
  carryForwardLabel: string;
};

export const journalRetrospectCopyJa: JournalRetrospectCopy = {
  frameTitle: "振り返り",
  title: "この年を振り返って",
  message: `一年を終えるころ、どんなことが心に残っているでしょうか。
最初に書いた思いとあわせて、静かに振り返ってみましょう。`,
  themeLabel: "今年のテーマはどう育ちましたか？",
  awarenessLabel: "意識していたことは、どんなふうに残りましたか？",
  impressionLabel: "印象に残ったこと",
  carryForwardLabel: "来年へ持っていきたいこと",
};

export function getJournalRetrospectCopy(): JournalRetrospectCopy {
  return journalRetrospectCopyJa;
}
