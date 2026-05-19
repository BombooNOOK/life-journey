import { IntroductionPage1 } from "./IntroductionPage1";
import { IntroductionPage2 } from "./IntroductionPage2";

/**
 * はじめに 2 ページ（背景 PNG + 生成テキスト）。
 * レガシー `introduction-page-1.png` / `introduction-page-2.png` は参照用に残置。
 */
export function IntroductionPages() {
  return (
    <>
      <IntroductionPage1 />
      <IntroductionPage2 />
    </>
  );
}
