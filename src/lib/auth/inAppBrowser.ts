/** LINE / Instagram 等のアプリ内ブラウザ。Google OAuth が失敗しやすい */
export function detectInAppBrowserLabel(userAgent?: string): string | null {
  const ua = userAgent ?? (typeof navigator !== "undefined" ? navigator.userAgent : "");
  if (!ua) return null;

  if (/Line\//i.test(ua)) return "LINE";
  if (/Instagram/i.test(ua)) return "Instagram";
  if (/FBAN|FBAV/i.test(ua)) return "Facebook";
  if (/Twitter/i.test(ua) || /\bX\b.*Twitter/i.test(ua)) return "X（Twitter）";
  if (/MicroMessenger/i.test(ua)) return "WeChat";

  const isIos =
    /iPad|iPhone|iPod/i.test(ua) ||
    (typeof navigator !== "undefined" &&
      navigator.platform === "MacIntel" &&
      navigator.maxTouchPoints > 1);
  if (isIos && !/Safari/i.test(ua)) return "アプリ内ブラウザ";

  if (/Android/i.test(ua) && /;\s*wv\)/.test(ua)) return "アプリ内ブラウザ";

  return null;
}

export function inAppBrowserGoogleLoginWarning(label: string | null): string | null {
  if (!label) return null;
  return `${label}のアプリ内ブラウザでは Google ログインがうまくいかないことが多いです。Safari または Chrome で URL を直接開いてからお試しください。`;
}
