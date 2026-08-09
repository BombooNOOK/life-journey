export const ACCOUNT_DELETE_CONFIRMATION_WORD = "削除" as const;

/**
 * deleteUserAccount が実際に消す範囲に合わせたユーザー向け一覧。
 * （内部 Profile 行・AccountSettings・関連テーブル・Blob・Firebase Auth）
 */
export const ACCOUNT_DELETE_DATA_ITEMS = [
  "森の住民票を含むアカウント設定",
  "あしあと本文・下書き",
  "あしあと写真",
  "鑑定・注文データおよび鑑定書PDF",
  "あしあとブック・本棚データ",
  "製本の申込データ",
  "お庭のデータ",
  "ポストのお知らせ",
  "システムお知らせの既読状態",
  "どんぐり台帳",
  "お問い合わせ履歴",
  "ログイン情報（メール／パスワード、Googleログインの紐づけ）",
] as const;
