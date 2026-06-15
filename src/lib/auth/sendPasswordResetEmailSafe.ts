import { sendPasswordResetEmail, type Auth } from "firebase/auth";

import { getPasswordResetActionCodeSettings } from "@/lib/auth/passwordResetActionCode";

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

/** パスワード再設定メール（戻り先 URL エラー時は設定なしで再試行） */
export async function sendLjPasswordResetEmail(auth: Auth, email: string): Promise<void> {
  const actionCodeSettings = getPasswordResetActionCodeSettings();
  try {
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
  } catch (e) {
    if (actionCodeSettings && isContinueUriError(e)) {
      await sendPasswordResetEmail(auth, email);
      return;
    }
    throw e;
  }
}
