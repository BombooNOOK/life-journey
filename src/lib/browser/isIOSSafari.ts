/** iPhone / iPad の Safari（CriOS 等の他ブラウザは除外） */
export function isIOSSafariUserAgent(
  ua: string,
  platform: string,
  maxTouchPoints: number,
): boolean {
  const isIosLike =
    /iPad|iPhone|iPod/i.test(ua) ||
    (platform === "MacIntel" && maxTouchPoints > 1);
  if (!isIosLike) return false;
  if (!/Safari/i.test(ua)) return false;
  if (/(CriOS|FxiOS|EdgiOS|OPiOS|OPR)/i.test(ua)) return false;
  return true;
}
