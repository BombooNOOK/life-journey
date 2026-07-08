/** 看板・章カード素材の縦横比（720×360） */
export const PATH_GUIDE_CARD_ASPECT = 720 / 360;

export const PATH_GUIDE_CARD_GAP_PX = 2;

export const PATH_GUIDE_CARD_ROW_COUNT = 4;

export type PathGuideViewportLayout = {
  contentWidthPx: number;
  signHeightPx: number;
  cardHeightPx: number;
};

type MeasureInput = {
  /** 看板＋カード4枚を載せる領域の幅 */
  containerWidthPx: number;
  /** 看板＋カード4枚を載せる領域の高さ（フッター除く） */
  containerHeightPx: number;
  /** 看板と1枚目カードの間隔 */
  sectionGapPx?: number;
};

/**
 * 看板1枚 + 章カード4枚を領域いっぱいに収める最大サイズを算出。
 * 看板・カードは同じ横幅で 2:1 の比率を保つ。
 */
export function computePathGuideViewportLayout({
  containerWidthPx,
  containerHeightPx,
  sectionGapPx = 4,
}: MeasureInput): PathGuideViewportLayout {
  if (containerWidthPx <= 0 || containerHeightPx <= 0) {
    return { contentWidthPx: 0, signHeightPx: 0, cardHeightPx: 0 };
  }

  const cardGaps = PATH_GUIDE_CARD_GAP_PX * (PATH_GUIDE_CARD_ROW_COUNT - 1);
  const fixedHeight = sectionGapPx + cardGaps;

  // signH = cardH = contentW / 2, 合計 = 5 * cardH
  const availableForCards = containerHeightPx - fixedHeight;
  const cardHeightByHeight = availableForCards / 5;
  const contentWidthByHeight = cardHeightByHeight * PATH_GUIDE_CARD_ASPECT;

  const contentWidthPx = Math.min(containerWidthPx, contentWidthByHeight);
  const cardHeightPx = contentWidthPx / PATH_GUIDE_CARD_ASPECT;
  const signHeightPx = cardHeightPx;

  return { contentWidthPx, signHeightPx, cardHeightPx };
}
