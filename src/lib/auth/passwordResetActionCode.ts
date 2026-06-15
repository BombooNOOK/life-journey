import type { ActionCodeSettings } from "firebase/auth";

/** Firebase パスワード再設定メールの戻り先（開いているオリジンに合わせる） */
export function getPasswordResetActionCodeSettings(): ActionCodeSettings | undefined {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!base) return undefined;
  return {
    url: `${base}/login`,
    handleCodeInApp: false,
  };
}
