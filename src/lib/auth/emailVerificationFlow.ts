/**
 * Email/password Firebase verification helpers (client-side).
 * Source of truth is Firebase Auth `user.emailVerified` only — never local force.
 */

export const EMAIL_VERIFICATION_RESEND_COOLDOWN_MS = 45_000;

/** Survives soft reload during signup verification; not used for legacy unverified logins. */
export const EMAIL_VERIFICATION_PENDING_SESSION_KEY = "ljd_email_verification_pending";

export type EmailVerificationUiPhase =
  | "idle"
  | "sending"
  | "sent"
  | "checking"
  | "verified"
  | "error";

export type EmailVerificationUserLike = {
  emailVerified: boolean;
  providerData?: Array<{ providerId: string } | null> | null;
  reload: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
};

export type EmailVerificationFlowDeps = {
  sendVerification: (user: EmailVerificationUserLike) => Promise<void>;
  nowMs?: () => number;
};

export function isPasswordProviderUser(user: {
  providerData?: Array<{ providerId: string } | null> | null;
}): boolean {
  const providers = (user.providerData ?? [])
    .map((p) => p?.providerId)
    .filter((id): id is string => Boolean(id));
  if (providers.length === 0) return false;
  const hasPassword = providers.includes("password");
  const hasFederated = providers.some((id) => id !== "password");
  // Password-only (or password without federated) — Google/other federated unchanged.
  return hasPassword && !hasFederated;
}

/**
 * Skip verified-session sync / Identity Binding completion for unverified
 * email/password users. Google and other federated providers are unaffected.
 */
export function shouldSkipVerifiedAuthCompletion(user: {
  emailVerified: boolean;
  providerData?: Array<{ providerId: string } | null> | null;
} | null): boolean {
  if (!user) return false;
  if (user.emailVerified) return false;
  return isPasswordProviderUser(user);
}

/** Safe user-facing message — never returns raw Firebase dumps / emails. */
export function mapEmailVerificationError(e: unknown): string {
  const code =
    typeof e === "object" && e !== null && "code" in e
      ? String((e as { code: unknown }).code)
      : "";
  const message =
    e instanceof Error
      ? e.message
      : typeof e === "object" && e !== null && "message" in e
        ? String((e as { message: unknown }).message)
        : "";
  const raw = `${code} ${message}`.toLowerCase();

  if (raw.includes("too-many-requests")) {
    return "送信回数が上限に達しました。しばらく待ってから再試行してください。";
  }
  if (raw.includes("network-request-failed") || raw.includes("network")) {
    return "通信に失敗しました。接続を確認してからもう一度お試しください。";
  }
  if (raw.includes("requires-recent-login")) {
    return "確認のため、もう一度ログインしてから再送してください。";
  }
  if (raw.includes("user-token-expired") || raw.includes("user-disabled")) {
    return "セッションの有効期限が切れました。ログインし直してください。";
  }
  if (raw.includes("invalid-user-token") || raw.includes("user-not-found")) {
    return "確認対象のアカウントが見つかりません。ログインし直してください。";
  }
  return "確認メールの処理に失敗しました。時間をおいて再試行してください。";
}

export type EmailVerificationCheckResult =
  | { status: "verified"; refreshedToken: boolean }
  | { status: "pending" };

/**
 * reload → inspect Firebase emailVerified → optional fresh ID token.
 * Never sets verified from local state alone.
 */
export async function checkEmailVerificationStatus(
  user: EmailVerificationUserLike,
): Promise<EmailVerificationCheckResult> {
  await user.reload();
  if (!user.emailVerified) {
    return { status: "pending" };
  }
  await user.getIdToken(true);
  return { status: "verified", refreshedToken: true };
}

export function createEmailVerificationController(deps: EmailVerificationFlowDeps) {
  let lastSendAtMs = 0;
  let sendInFlight = false;
  let checkInFlight = false;

  function remainingCooldownMs(now = deps.nowMs?.() ?? Date.now()): number {
    if (lastSendAtMs <= 0) return 0;
    return Math.max(0, EMAIL_VERIFICATION_RESEND_COOLDOWN_MS - (now - lastSendAtMs));
  }

  async function send(user: EmailVerificationUserLike): Promise<{ ok: true } | { ok: false; message: string }> {
    if (sendInFlight) {
      return { ok: false, message: "送信処理中です。完了するまでお待ちください。" };
    }
    if (remainingCooldownMs() > 0) {
      return {
        ok: false,
        message: "再送は少し間隔を空けてください。届くまで迷惑メールフォルダもご確認ください。",
      };
    }
    sendInFlight = true;
    try {
      await deps.sendVerification(user);
      lastSendAtMs = deps.nowMs?.() ?? Date.now();
      return { ok: true };
    } catch (e) {
      return { ok: false, message: mapEmailVerificationError(e) };
    } finally {
      sendInFlight = false;
    }
  }

  async function check(
    user: EmailVerificationUserLike,
  ): Promise<EmailVerificationCheckResult | { status: "error"; message: string }> {
    if (checkInFlight) {
      return { status: "error", message: "確認処理中です。完了するまでお待ちください。" };
    }
    checkInFlight = true;
    try {
      return await checkEmailVerificationStatus(user);
    } catch (e) {
      return { status: "error", message: mapEmailVerificationError(e) };
    } finally {
      checkInFlight = false;
    }
  }

  return {
    send,
    check,
    remainingCooldownMs,
    /** Test helper */
    _setLastSendAtMsForTests(ms: number) {
      lastSendAtMs = ms;
    },
  };
}
