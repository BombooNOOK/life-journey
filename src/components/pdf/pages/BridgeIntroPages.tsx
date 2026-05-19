import { BridgeGuideBleedPage } from "./BridgeGuideBleedPage";

/**
 * ブリッジナンバー「とは」2 ページ（背景 PNG + 生成テキスト・ページ番号のみ）。
 */
export function BridgeIntroPages() {
  return (
    <>
      <BridgeGuideBleedPage page="page1" />
      <BridgeGuideBleedPage page="page2" />
    </>
  );
}
