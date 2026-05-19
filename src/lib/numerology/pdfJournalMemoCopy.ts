/**
 * 第4章・余白ページ（`journal-invite-4-bg` / `journal-invite-5-bg` + 生成テキスト）。
 * Canva: `yohaku` / 右Pのみ `yohaku_fukuro`（フクロウ本体は背景 PNG）。
 */
export type JournalMemoPageKey = "left" | "right";

export type JournalMemoCopy = {
  frameTitle: string;
  /** Canva `yohaku` */
  title: string;
  /** Canva `yohaku_fukuro`（右P・吹き出し内） */
  fukuroComment: string;
};

export const journalMemoCopyJa: JournalMemoCopy = {
  frameTitle: "メモ",
  title: "余白のページ",
  fukuroComment: `うまくまとまらなくても、
そのままで大丈夫ですよ。`,
};

export function getJournalMemoCopy(): JournalMemoCopy {
  return journalMemoCopyJa;
}
