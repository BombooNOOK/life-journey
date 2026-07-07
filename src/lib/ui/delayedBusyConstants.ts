/** この時間より短い処理ではフクロウを出さない */
export const DELAYED_BUSY_SPINNER_MS = 280 as const;

/** この時間を超えたら軽い待ちでも文言を出す（任意） */
export const DELAYED_BUSY_MESSAGE_MS = 900 as const;
