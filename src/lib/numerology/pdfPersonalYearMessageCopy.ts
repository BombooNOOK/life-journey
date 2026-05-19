/**
 * パーソナルイヤー章前「フクロウ先生からのメッセージ」（マチュリティの次）。
 * 背景は `personal-year-message-bg.png`（文字なし）。
 */
export type PersonalYearMessageCopy = {
  frameTitle: string;
  body: string;
  /** フクロウ回避の下段分割 */
  bodyOwlMarginSplit?: string;
};

export const personalYearMessageCopyJa: PersonalYearMessageCopy = {
  frameTitle: "フクロウ先生からのメッセージ",
  body: `ここまでのページでは、
あなたが生まれながらに持っている性質や、
心の奥にある願い、
少しずつ育っていく役割を見つめてきました。

それは、あなたという人の土台のようなものです。

けれど人生には、その土台の上に、
さまざまな季節がめぐってきます。

進みやすい時期。
立ち止まることに意味がある時期。
外へ向かう流れ。
内側を整える流れ。

ここから先では、
そんなこれからの時間の流れを見ていきましょう。
未来は、決めつけるものではなく、
そっと迎えるもの。
そのための小さな手がかりとして、
次のページをひらいてみてくださいね。

フクロウ先生`,
  /** 上段の行数を抑え、長い1行（土台／見ていきましょう）がページ圧縮で折られないようにする */
  bodyOwlMarginSplit: "\n\n進みやすい時期。",
};

export function getPersonalYearMessageCopy(): PersonalYearMessageCopy {
  return personalYearMessageCopyJa;
}
