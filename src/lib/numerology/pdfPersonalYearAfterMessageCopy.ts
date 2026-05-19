/**
 * パーソナルイヤー章後「フクロウ先生からのメッセージ」（第2章末・目次 p.46 付近）。
 * 背景は `personal-year-after-message-bg.png`（文字なし）。
 */
export type PersonalYearAfterMessageCopy = {
  frameTitle: string;
  /** Canva `46_ue` */
  upperBody: string;
  /** Canva `46_shita`（各行 `・` 始まり・10.5pt bold） */
  lowerBody: string;
};

export const personalYearAfterMessageCopyJa: PersonalYearAfterMessageCopy = {
  frameTitle: "フクロウ先生からのメッセージ",
  upperBody: `これまで見てきた数字のあいだには、
言葉にしにくいギャップが生まれることもあります。

次の章のブリッジナンバーでは、
そんな「あいだにあるもの」を静かに探っていきます。

全部を順番に読まなくても大丈夫。
気になるテーマから、
ゆっくりたどってみてくださいね。`,
  lowerBody: `・進みたいのに、うまく進めないとき
・進んでいるはずなのに、心がついてこないとき
・ちゃんと伝わっていない気がするとき
・自分の強みを、うまく活かせないとき
・やるべきことはあるのに、心が納得しないとき
・本当は違う形で力を出したいのに、上手く伝わらないとき
・持っている力を、どこで使えばいいか迷うとき
・本音と見せ方が、うまく重ならないとき
・得意なことと、心が望むことがずれるとき
・周囲の印象と、自分の持ち味が噛み合わないとき`,
};

export function getPersonalYearAfterMessageCopy(): PersonalYearAfterMessageCopy {
  return personalYearAfterMessageCopyJa;
}
