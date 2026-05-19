/**
 * はじめに 2 ページの生成テキスト。
 * 背景は `introduction-page-1-bg.png` / `introduction-page-2-bg.png`（文字なし）。
 *
 * 斜体: 行頭 `~` で行全体、`*…*` で行内（ナンバー「とは」と同じ）
 */
export type IntroductionPageKey = "page1" | "page2";

export type IntroductionPageCopy = {
  frameTitle: string;
  title: string;
  body: string;
  /** フクロウ回避の下段分割（2P 用。例: `\n\nこの一冊が、`） */
  bodyOwlMarginSplit?: string;
};

export const introductionCopyJa: Record<IntroductionPageKey, IntroductionPageCopy> = {
  page1: {
    frameTitle: "はじめに",
    title: "はじめに",
    body: `この冊子は、数秘術を通して、
自分自身を静かに見つめていくためのガイドです。

数秘術とは、生年月日や名前から導き出される数字
をもとに、その人の性質や、人生の流れ、心の奥に
ある願い、そして育っていく役割などを
読み解いていく方法のひとつです。

数字には、それぞれ固有の意味があるとされていて、
私たちの中にもまた、その数字の流れがやわらかく
表れていることがあります。

この冊子では、
ライフパスナンバー、ディスティニーナンバーなど、
いくつかの大切な数字を通して、あなたらしさを
いくつもの角度から見つめていきます。

いまの自分を少しやさしく理解したいとき。
これからの流れを静かに見つめてみたいとき。
そんなときの、小さな手がかりとして受け取っていた
だけたら幸いです。`,
  },
  page2: {
    frameTitle: "このガイドの案内人",
    title: "このガイドの案内人",
    body: `こんにちは。
この本をひらいてくださり、ありがとうございます。
このガイドの案内人のフクロウ先生です。

数字は、
あなたを縛るためのものではなく、
今のあなたを、少しやさしく見つめるための
小さな灯りのようなものだと、私は思っています。

すぐに答えが見つからなくても大丈夫。
ピンと来る言葉だけ、そっと受け取ってくだされば、
それで十分です。

この一冊が、
あなたの歩みを見つめる
静かな時間になりますように。

フクロウ先生`,
    bodyOwlMarginSplit: "\n\nこの一冊が、",
  },
};

export function getIntroductionCopy(key: IntroductionPageKey): IntroductionPageCopy {
  return introductionCopyJa[key];
}
