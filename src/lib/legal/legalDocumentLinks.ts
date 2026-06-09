/** 法務ページのパス（フッター・マイページ等で共通利用） */
export const PRIVACY_POLICY_PATH = "/privacy" as const;

/** 将来の利用規約ページ用（ページ未実装） */
export const TERMS_OF_SERVICE_PATH = "/terms" as const;

export const PRIVACY_POLICY_LABEL = "プライバシーポリシー" as const;
export const TERMS_OF_SERVICE_LABEL = "利用規約" as const;

/** マイページ内お問い合わせフォーム（`MyPageContactSection` の id と対応） */
export const MYPAGE_CONTACT_FORM_PATH = "/orders#contact-form" as const;
export const MYPAGE_CONTACT_FORM_LOGIN_PATH =
  "/login?returnTo=%2Forders%23contact-form" as const;
export const MYPAGE_CONTACT_FORM_LABEL = "お問い合わせ" as const;
