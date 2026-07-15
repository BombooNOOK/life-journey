/** /orders のユーザー向け表記 */
export const LOG_HOUSE_PAGE_TITLE = "ログハウス";

export const LOG_HOUSE_SHORT_LABEL = "ログハウス";

/** 行き先がログハウス固定のときの戻る文言 */
export const LOG_HOUSE_RETURN_TO_LABEL = "ログハウスへ戻る";

/**
 * 行き先がログハウス固定のときの戻る導線。
 * 「もといた場所」は returnTo で行き先が変わる画面だけで使う。
 */
export const LOG_HOUSE_BACK_LINK = {
  href: "/orders" as const,
  label: `← ${LOG_HOUSE_RETURN_TO_LABEL}` as const,
};

export const LOG_HOUSE_BACK_TO_LINK_LABEL = `← ${LOG_HOUSE_RETURN_TO_LABEL}` as const;

/** returnTo がある画面向けの汎用「戻る」文言（行き先は呼び出し側の href） */
export const LOG_HOUSE_BACK_TO_LABEL = "もといた場所に戻る";

export const LOG_HOUSE_LOADING_LABEL = "ログハウスを開いています…";

export const LOG_HOUSE_MOVING_LABEL = "ログハウスへ移動しています…";

export const LOG_HOUSE_NAV_LABEL = "ログハウス";

export const LOG_HOUSE_TO_LABEL = "ログハウスへ";

export const LOG_HOUSE_GO_LABEL = "ログハウスへ進む";

export const LOG_HOUSE_OPEN_LABEL = "ログハウスを開く";

export const LOG_HOUSE_LOAD_ERROR_TITLE = "ログハウスを読み込めませんでした";

export const LOG_HOUSE_TAGLINE =
  "BambooNOOKの森で、今日のページをひらこう。";

export const LOG_HOUSE_RESIDENT_CARD_LOADING_LABEL =
  "森の住民票を開いています…";

/** ログハウス「② やりたいことを選ぶ」セクション（第3章導線の着地先） */
export const LOG_HOUSE_MAIN_ACTIONS_SECTION_ID = "main-actions";

export const LOG_HOUSE_MAIN_ACTIONS_HREF =
  `/orders#${LOG_HOUSE_MAIN_ACTIONS_SECTION_ID}` as const;
