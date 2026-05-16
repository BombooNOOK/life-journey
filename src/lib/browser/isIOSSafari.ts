/** iOS Safari プレビュー下端クリップ対策の余白（px） */
export const IOS_SAFARI_PREVIEW_BOTTOM_SAFE_PX = 6;

/** iPhone / iPad の Safari（CriOS 等の他ブラウザは除外） */
export function isIOSSafariUserAgent(
  ua: string,
  platform: string,
  maxTouchPoints: number,
  userAgentDataPlatform?: string,
): boolean {
  const isIosLike =
    /iPad|iPhone|iPod/i.test(ua) ||
    userAgentDataPlatform === "iOS" ||
    (platform === "MacIntel" && maxTouchPoints > 1);
  if (!isIosLike) return false;
  if (/(CriOS|FxiOS|EdgiOS|OPiOS|OPR|Chrome|Chromium)/i.test(ua)) return false;
  // Version/…Mobile は iOS WebKit 標準ブラウザ（Safari）で共通
  return /Safari/i.test(ua) || /AppleWebKit/i.test(ua);
}

export function readIsIOSSafariFromNavigator(): boolean {
  if (typeof navigator === "undefined") return false;
  const uaData = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  return isIOSSafariUserAgent(
    navigator.userAgent,
    navigator.platform,
    navigator.maxTouchPoints,
    uaData.userAgentData?.platform,
  );
}
