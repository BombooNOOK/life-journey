import { NumberGuideBleedPage } from "./NumberGuideBleedPage";
import { PersonalYearMessageBleedPage } from "./PersonalYearMessageBleedPage";

/** マチュリティの次 — `personal-year-message-bg.png` + 生成テキスト */
export function PersonalYearMessagePage() {
  return <PersonalYearMessageBleedPage />;
}

/** 「パーソナルイヤーナンバーとは」— `number-guide-bg.png` + 生成テキスト */
export function PersonalYearGuidePage() {
  return <NumberGuideBleedPage guideKey="personalYear" />;
}

/**
 * マチュリティの後に入る 2 ページ導入（全面画像・ヘッダーなし・ページ番号のみ）。
 * 1P: フクロウ先生メッセージ（生成テキスト） / 2P: パーソナルイヤー「とは」
 */
export function PersonalYearIntroPages() {
  return (
    <>
      <PersonalYearMessagePage />
      <PersonalYearGuidePage />
    </>
  );
}
