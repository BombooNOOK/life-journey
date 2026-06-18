/** 法務ページのパス（フッター・マイページ等で共通利用） */
export const PRIVACY_POLICY_PATH = "/privacy" as const;

/** 利用規約ページ */
export const TERMS_OF_SERVICE_PATH = "/terms" as const;

export const PRIVACY_POLICY_LABEL = "プライバシーポリシー" as const;
export const TERMS_OF_SERVICE_LABEL = "利用規約" as const;

/** マイページ内お問い合わせフォーム（`MyPageContactSection` の id と対応） */
export const MYPAGE_CONTACT_FORM_PATH = "/orders/support#contact-form" as const;
export const MYPAGE_CONTACT_FORM_LOGIN_PATH =
  "/login?returnTo=%2Forders%2Fsupport%23contact-form" as const;
export const MYPAGE_CONTACT_FORM_LABEL = "お問い合わせ" as const;

/** 未ログイン向けお問い合わせフォーム（メール返信） */
export const GUEST_CONTACT_FORM_PATH = "/contact" as const;
export const GUEST_CONTACT_FORM_LABEL = MYPAGE_CONTACT_FORM_LABEL;
