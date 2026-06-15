import type { ActionCodeSettings } from "firebase/auth";

/** Firebase パスワード再設定メールの戻り先（本番・Preview のオリジンに合わせる） */
export function getPasswordResetActionCodeSettings(): ActionCodeSettings | undefined {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    (typeof window !== "undefined" ? window.location.origin : undefined);
  if (!base) return undefined;
  return {
    url: `${base}/login`,
    handleCodeInApp: false,
  };
}
