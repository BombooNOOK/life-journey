/**
 * おわりに 2P（`afterword-1-bg` / `afterword-2-bg` + 生成テキスト）。
 * Canva: `last_title` / `last_hon1`（左P）/ `last_hon2`（右P）
 */
export type AfterwordPageKey = "left" | "right";

export type AfterwordCopy = {
  frameTitle: string;
  /** Canva `last_title`（左Pのみ） */
  title: string;
  /** Canva `last_hon1` */
  bodyLeft: string;
  /** Canva `last_hon2` */
  bodyRight: string;
};

export const afterwordCopyJa: AfterwordCopy = {
  frameTitle: "おわりに",
  title: "おわりに",
  bodyLeft: `ここまで読み進めてくださって、
ありがとうございます。

生まれ持った性質。
あなたに与えられた役割。
心の奥にある願い。
外に伝わる印象。
もともと備わっている強み。
そして、時間の中でめぐってくる流れ。

どの言葉が心に残ったでしょうか。
どのページで、少し立ち止まりたくなったでしょうか。

数字は、
あなたを決めつけるためのものではなく、
今のあなたをやさしく照らすための、
ひとつの手がかりなのだと思います。`,
  bodyRight: `だから、
ぴたりと当てはまるところも、
まだ少し遠く感じるところも、
そのままで大丈夫ですよ。

そして、これから先、
季節が変わるように気持ちや流れが変わったとき、
またこの本をひらいてみてください。

そのときには、
今とは少し違う言葉が、
そっと心に届くことでしょう。

この一冊が、
あなた自身を見つめるための、
静かであたたかな時間に
つながっていきますように。

フクロウ先生`,
};

export function getAfterwordCopy(pageKey: AfterwordPageKey): {
  frameTitle: string;
  title: string;
  body: string;
} {
  const c = afterwordCopyJa;
  return {
    frameTitle: c.frameTitle,
    title: c.title,
    body: pageKey === "left" ? c.bodyLeft : c.bodyRight,
  };
}
