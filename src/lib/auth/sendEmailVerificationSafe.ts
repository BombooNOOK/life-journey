import { sendEmailVerification, type ActionCodeSettings, type User } from "firebase/auth";

/** Firebase 確認メールの戻り先（開いているオリジンに合わせる。固定localhost/Production専用URLは使わない） */
export function getEmailVerificationActionCodeSettings(): ActionCodeSettings | undefined {
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

function isContinueUriError(e: unknown): boolean {
  const raw =
    e instanceof Error
      ? e.message
      : typeof e === "object" && e !== null && "code" in e
        ? String((e as { code: unknown }).code)
        : String(e);
  return (
    raw.includes("invalid-continue-uri") ||
    raw.includes("unauthorized-continue-uri") ||
    raw.includes("auth/unauthorized-domain")
  );
}

/** メール確認リンク送信（戻り先 URL エラー時は設定なしで再試行） */
export async function sendLjEmailVerification(user: User): Promise<void> {
  const actionCodeSettings = getEmailVerificationActionCodeSettings();
  try {
    if (actionCodeSettings) {
      await sendEmailVerification(user, actionCodeSettings);
      return;
    }
    await sendEmailVerification(user);
  } catch (e) {
    if (actionCodeSettings && isContinueUriError(e)) {
      await sendEmailVerification(user);
      return;
    }
    throw e;
  }
}
