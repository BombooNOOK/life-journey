export const DAILY_FORTUNE_PAGE_TITLE = "今日の鑑定結果";

export const DAILY_FORTUNE_HELP_BUTTON_LABEL = "今日の鑑定結果について";

export const DAILY_FORTUNE_HELP_TITLE = "今日の鑑定結果について";

export const DAILY_FORTUNE_HELP_BODY = [
  "今日のすうじから、",
  "今日のひとこと・お守りカラー・小さな行動をお届けします。",
  "",
  "届け役の鑑定士は日替わりです。",
  "内容は、今まで通りの今日の鑑定結果です。",
].join("\n");

export const DAILY_FORTUNE_HELP_DISMISS = "わかりました";

export const DAILY_FORTUNE_THEME_BUTTON_LABEL = "今年と今月のテーマを見る";

export const DAILY_FORTUNE_THEME_MODAL_TITLE = "今年・今月のテーマ";

export const DAILY_FORTUNE_THEME_DISMISS = "わかりました";

export const DAILY_FORTUNE_THEME_PREPARING = "ただいま準備中です。";

export const DAILY_FORTUNE_FONT_SIZE_LINK_LABEL = "文字の大きさ";

export const DAILY_FORTUNE_FONT_SIZE_MODAL_TITLE = "文字の大きさ";

export const DAILY_FORTUNE_FONT_SIZE_DISMISS = "とじる";

export function dailyFortuneGuideAnnouncement(guideName: string): string {
  return `本日は\n${guideName}がお届けします`;
}
