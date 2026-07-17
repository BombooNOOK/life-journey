/** どんぐり不足・あしあと保存の案内コピー（クライアント可） */

export const DONGURI_SHORTAGE_THRESHOLD = 2 as const;

export const DONGURI_SHORTAGE_PRE_TITLE = "どんぐりが少なくなっています" as const;

export const DONGURI_SHORTAGE_SAVE_TITLE = "どんぐりが足りません" as const;

export const DONGURI_SHORTAGE_SAVE_BODY = [
  "今日のページを「森のあしあと」として残すには、",
  "どんぐりが3こ必要です。",
  "",
  "今は下書きとして残しておくことができます。",
  "どんぐりがたまったら、あとから森に残せます。",
  "",
  "どんぐりの受け取り方は、",
  "どんぐり帳から確認できます。",
].join("\n");

export function donguriShortagePreBody(balance: number): string {
  return [
    `今のどんぐりは、${balance}こです。`,
    "",
    "今日のページを「森のあしあと」として残すには、",
    "どんぐりが3こ必要です。",
    "",
    "今は、下書きとして書いておくことができます。",
    "どんぐりがたまったら、あとから森に残せます。",
    "",
    "どんぐりの受け取り方は、",
    "どんぐり帳から確認できます。",
  ].join("\n");
}

export const DONGURI_FOOTPRINT_CONFIRM_TITLE = "今日のページを森に残しますか？" as const;

export const DONGURI_FOOTPRINT_CONFIRM_BODY = [
  "このページを「森のあしあと」として残すには、",
  "どんぐりを3こ使います。",
].join("\n");

export const DONGURI_DRAFT_RESUME_TITLE = "書きかけの下書きがあります" as const;

export const DONGURI_DRAFT_RESUME_BODY = [
  "この日に書きかけた下書きがあります。",
  "続きを書きますか？",
].join("\n");

export const DONGURI_DRAFT_RESET_CONFIRM =
  "今ある下書きを消して、新しく書き直しますか？" as const;

export const BTN_DRAFT_WRITE = "下書きで書く" as const;
export const BTN_DRAFT_SAVE = "下書きとして残す" as const;
export const BTN_FOOTPRINT_SAVE = "森にあしあとを残す" as const;
export const BTN_FOOTPRINT_CONFIRM = "森に残す" as const;
export const BTN_MAKE_DRAFT = "下書きにする" as const;
export const BTN_VIEW_DONGURI = "どんぐり帳を見る" as const;
export const BTN_SKIP_TODAY = "今日はやめておく" as const;
export const BTN_CONTINUE_DRAFT = "続きを書く" as const;
export const BTN_REWRITE_DRAFT = "新しく書き直す" as const;
export const BTN_CLOSE = "閉じる" as const;
export const BTN_BACK = "戻る" as const;
