/** 机タップ後：日記の書き方選択（はじめて導線は伴走執筆へ直遷移） */

export const LOG_HOUSE_DESK_WRITE_PAGE_PATH = "/orders/write" as const;

export const LOG_HOUSE_DESK_WRITE_PAGE_TITLE = "今日はどうしますか？" as const;

export const LOG_HOUSE_DESK_WRITE_PAGE_DESCRIPTION =
  "日記には、ひとりで書く方法と、どうぶつ鑑定士といっしょに書く方法があります。" as const;

export const LOG_HOUSE_DESK_WRITE_SOLO_TITLE = "ひとりで書く" as const;

export const LOG_HOUSE_DESK_WRITE_SOLO_DESCRIPTION =
  "カレンダーから、自分のペースで今日のページを残します。" as const;

export const LOG_HOUSE_DESK_WRITE_COMPANION_TITLE = "鑑定士といっしょに書く" as const;

export const LOG_HOUSE_DESK_WRITE_COMPANION_DESCRIPTION =
  "どうぶつ鑑定士と会話しながら、短く書きはじめます。" as const;

export const LOG_HOUSE_DESK_WRITE_SOLO_HREF = "/orders/calendar" as const;

export const LOG_HOUSE_DESK_WRITE_PROFILE_LABEL = "このプロフィールで書く" as const;

export const LOG_HOUSE_DESK_WRITE_PROFILE_HINT =
  "プロフィールが複数あるときだけ、ここで切り替えられます。" as const;

/**
 * はじめての日記（鑑定済み・日記0件）は選択画面を挟まず伴走執筆へ。
 * それ以外の通常利用は `/orders/write`。
 */
export function resolveLogHouseDeskWritingHref(input: {
  firstVisitGuideState: "needs_kantei" | "ready_first_journal" | "returning";
  companionWritingHref: string;
}): string {
  if (input.firstVisitGuideState === "ready_first_journal") {
    return input.companionWritingHref;
  }
  return LOG_HOUSE_DESK_WRITE_PAGE_PATH;
}
