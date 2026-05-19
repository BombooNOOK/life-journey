/**
 * ブリッジナンバー「とは」2ページ（背景 `bridge-guide-page-1-bg.png` / `bridge-guide-page-2-bg.png`）。
 * Canva: `title_bri` / `hon_bri01` / `hon_bri02`
 */
export type BridgeGuidePageKey = "page1" | "page2";

export type BridgeGuidePageCopy = {
  frameTitle: string;
  /** 1P のみ（`title_bri`） */
  title?: string;
  body: string;
  bodyOwlMarginSplit?: string;
};

export const bridgeGuideCopyJa: Record<BridgeGuidePageKey, BridgeGuidePageCopy> = {
  page1: {
    frameTitle: "ブリッジナンバーとは",
    title: "ブリッジ・ナンバー",
    body: `ブリッジナンバーというのはね、
数字と数字のあいだにある流れを知るためのものなんだよ。

ここまでのページでは、
あなたが生まれながらに持っている性質や、
心の奥にある願い、育っていく役割などを
それぞれひとつずつ見てきたよね。

けれど人の中には、
ひとつの性質だけでは語れない揺れや、
うまく言葉にしにくい迷いが生まれることもあるんだ。

たとえば、
進みたい気持ちはあるのに、なぜか足が止まってしまう。
心では望んでいるのに、うまく外に出せない。
本当の自分と、人から見られる印象が少し
ずれて感じられる。
そんなことも、あるかもしれないね。

ブリッジナンバーは、
そうした数字同士のあいだに生まれやすい関係を
やさしく読み解くための数字なんだ。`,
    bodyOwlMarginSplit: "\n\nブリッジナンバーは、",
  },
  page2: {
    frameTitle: "ブリッジナンバーとは",
    body: `数字がぴたりと重なっているときもあれば、
少し距離があるように見えるときもある。
けれど、どちらが良い・悪いということではないんだよ。

重なっているなら、その強さをどう活かすか。
距離があるなら、その違いとどう付き合っていくか。
大切なのは、その人の中にある流れを、
無理なく理解していくことなんだと思うよ。


ここからのページでは、
数字と数字のあいだにある関係を、
ひとつずつ静かに見ていきましょう。
今までより少しだけ繊細な話になるけれど、
きっと、あなた自身を知る助けになるはずだよ。`,
    bodyOwlMarginSplit: "\n\nここからのページでは、",
  },
};

export function getBridgeGuideCopy(page: BridgeGuidePageKey): BridgeGuidePageCopy {
  return bridgeGuideCopyJa[page];
}
