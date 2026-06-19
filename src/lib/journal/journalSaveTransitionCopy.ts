/** 保存直後演出：ランダム文が現れるまでの待ち（ms） */
export const JOURNAL_SAVE_TRANSITION_RANDOM_LINE_DELAY_MS = 700;

/** 演出開始からプレビュー遷移までの目安（ms） */
export const JOURNAL_SAVE_TRANSITION_TOTAL_MS = 2000;

/** 日記保存直後のストーリー演出用。日記本文・気分には依存しない中立文 */
export const JOURNAL_SAVE_TRANSITION_LINES = [
  "書き残したことの中に、\nあとから気づける小さなヒントがあるかもしれません。",
  "今日のことばは、\n少し時間をおいてから見えるものがあるかもしれません。",
  "何気なく見える一日も、\nあとから大切なページになることがあります。",
  "その日の記録は、\nすぐに答えを出さなくても大丈夫です。",
  "書いたことの奥に、\nまだ名前のついていない気持ちが残っているかもしれません。",
  "今日のページは、\nあとからそっと読み返すために残りました。",
  "いまは小さく見えることも、\n時間が経つと違って見えることがあります。",
  "この記録が、\nいつか自分を少し助けてくれるかもしれません。",
  "すぐには分からないことも、\n日記の中に静かに残っていきます。",
  "書き残した一日は、\nあとから別の表情を見せることがあります。",
  "置いておいた記録は、\n急いで意味を見つけなくてもかまいません。",
  "言葉にできなかったことも、\nページの上で休んでいます。",
  "記録は残ったまま、\nあなたは次へ進んで大丈夫です。",
  "あとから読み返すとき、\n違う気持ちで開けるかもしれません。",
  "静かに残したページは、\nいつか必要なときに届きます。",
  "今日書いたことは、\n今日のまま受け取っておけます。",
  "意味づけは、\nあとからでも十分です。",
  "この記録は、\n自分のために残っています。",
  "書いたばかりのページも、\n時間とともに重さが変わることがあります。",
  "その日の空気は、\n言葉のあいだに静かに残っているかもしれません。",
  "完結しなくても、\nページはちゃんと残りました。",
  "読み返すのは、\nいま急がなくて大丈夫です。",
  "ここに残ったことばは、\nあなたのペースで向き合えます。",
  "何も決めつけなくてよい一日も、\n記録として残せます。",
  "この一行は、\nあなたの一日そのものです。",
] as const;

export function pickJournalSaveTransitionLine(): string {
  const index = Math.floor(Math.random() * JOURNAL_SAVE_TRANSITION_LINES.length);
  return JOURNAL_SAVE_TRANSITION_LINES[index] ?? JOURNAL_SAVE_TRANSITION_LINES[0];
}

/** 演出開始時刻から、プレビュー遷移まであと何 ms 待つか */
export function journalSaveTransitionRemainingMs(startedAt: number, now = Date.now()): number {
  return Math.max(0, JOURNAL_SAVE_TRANSITION_TOTAL_MS - (now - startedAt));
}
