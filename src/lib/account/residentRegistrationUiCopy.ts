/** 住民登録まわりの一般UI表示名 */

export const RESIDENT_REGISTRATION_INFO_LABEL = "住民登録情報" as const;
export const RESIDENT_REGISTRATION_INFO_LOADING_LABEL = "住民登録情報を開いています…" as const;

/** 現状ZIP対象はあしあと系のみ。森ログ等を含むように見せない */
export const ASHIATO_BACKUP_LABEL = "あしあとのバックアップ" as const;
export const ASHIATO_BACKUP_LOADING_LABEL = "あしあとのバックアップを開いています…" as const;

/** 削除確認ページ見出し */
export const LEAVE_RESIDENT_REGISTRATION_BEFORE_HEADING = "住民登録をやめる前に" as const;

/** 主要CTA（括弧の「アカウント削除」は付けない） */
export const LEAVE_RESIDENT_REGISTRATION_LABEL = "住民登録をやめる" as const;

/** 最終確認モーダル */
export const LEAVE_RESIDENT_REGISTRATION_CONFIRM_TITLE = "本当に住民登録をやめますか？" as const;
export const LEAVE_RESIDENT_REGISTRATION_CONFIRM_BODY =
  "この操作を行うと、保存されているデータは元に戻せません。" as const;
export const LEAVE_RESIDENT_REGISTRATION_CONFIRM_SUBMIT = "削除して住民登録をやめる" as const;
