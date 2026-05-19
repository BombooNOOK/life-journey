/**
 * ブリッジ章後「フクロウ先生からのメッセージ」（目次 p.64 付近）。
 * 背景は `bridge-after-message-bg.png`（文字なし）。
 * Canva: `hon_bridge-after-message`（X 2.73 / Y 3.78 / 幅 15.55 cm）
 */
export type BridgeAfterMessageCopy = {
  frameTitle: string;
  body: string;
  bodyOwlMarginSplit?: string;
};

export const bridgeAfterMessageCopyJa: BridgeAfterMessageCopy = {
  frameTitle: "フクロウ先生からのメッセージ",
  body: `これまで、いくつかの数字を通して、
あなたの中にあるものを、静かに見つめてきましたね。

言葉になっていたこともあれば、
なんとなく感じていただけのものもあったかもしれません。

ここからは、少しだけ流れが変わります。

読むだけでなく、
あなたの中にあるものを、外へと置いていく時間です。

うまく言葉にしようとしなくても大丈夫。
きれいにまとめなくても、大丈夫ですよ。

そのときに浮かんだことや、まだ形になっていない思いも、
そのまま書きとめてみてください。

ここに残る言葉は、誰かのためではなく、
あなた自身のためのものです。

今のあなたのままで、
そっと置いていってくださいね。

フクロウ先生`,
  bodyOwlMarginSplit: "\n\nそのときに浮かんだことや、",
};

export function getBridgeAfterMessageCopy(): BridgeAfterMessageCopy {
  return bridgeAfterMessageCopyJa;
}
