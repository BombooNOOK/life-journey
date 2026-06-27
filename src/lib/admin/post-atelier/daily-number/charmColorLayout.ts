/**
 * おまもりカラー値の SVG 配置。
 * cx は Canva で1文字色名を置いたときの中心。実際はその左端から左揃え（全長共通の開始 x）。
 * 画像に出る色名は最大3文字想定（ピンク、橙・茶 など）。
 */
const CHARM_COLOR_X_NUDGE_PX = -8;

/** レイアウト計算用の最大文字数（ゴールド等4文字は画像に出ない想定） */
export const CHARM_COLOR_IMAGE_MAX_CHARS = 3;

export function dailyNumberCharmColorSvgPosition(
  cx: number,
  fontSize: number,
  _colorText: string,
): { x: number; textAnchor: "start" } {
  const x = cx - Math.round(fontSize / 2) + CHARM_COLOR_X_NUDGE_PX;
  return { x, textAnchor: "start" };
}
