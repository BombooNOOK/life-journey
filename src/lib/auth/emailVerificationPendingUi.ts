/**
 * Copy / button priority for email-verification pending UI.
 * Display-only — does not change Firebase send/check semantics.
 */

export type EmailVerificationPendingPhase =
  | "sending"
  | "sent"
  | "checking"
  | "error"
  | "verified";

export const EMAIL_VERIFICATION_SENT_HEADING = "確認メールを送信しました";
export const EMAIL_VERIFICATION_ERROR_HEADING = "確認メールを送信できませんでした";
export const EMAIL_VERIFICATION_SENDING_HEADING = "確認メールを送信しています";
export const EMAIL_VERIFICATION_CHECKING_HEADING = "確認状態を調べています";

export const EMAIL_VERIFICATION_SENT_STEPS = [
  "メールを開く",
  "「メールアドレスを確認する」リンクを押す",
  "この画面に戻って「確認済みかチェック」を押す",
] as const;

export const EMAIL_VERIFICATION_WELCOME_DISTINCT_SENT =
  "『ご登録ありがとうございます』という案内メールとは別の確認メールです。";

export const EMAIL_VERIFICATION_WELCOME_DISTINCT_ERROR =
  "『ご登録ありがとうございます』メールが届いていても、メールアドレス確認はまだ完了していません。";

export const EMAIL_VERIFICATION_TOO_MANY_REQUESTS_BODY =
  "現在、確認メールの送信回数制限がかかっています。しばらく時間をあけてから『確認メールを再送』を押してください。";

export type EmailVerificationPendingUiModel = {
  heading: string;
  showSentSuccessClaim: boolean;
  steps: readonly string[] | null;
  welcomeDistinction: string | null;
  spamHint: string | null;
  statusLine: string | null;
  alertMessage: string | null;
  primaryAction: "check" | "resend";
};

function isTooManyRequestsMessage(message: string | null | undefined): boolean {
  if (!message) return false;
  const low = message.toLowerCase();
  return low.includes("上限") || low.includes("too-many-requests") || low.includes("回数制限");
}

export function resolveEmailVerificationPendingUi(input: {
  phase: EmailVerificationPendingPhase;
  errorMessage?: string | null;
}): EmailVerificationPendingUiModel {
  const { phase, errorMessage } = input;

  if (phase === "error") {
    const alert =
      errorMessage && isTooManyRequestsMessage(errorMessage)
        ? EMAIL_VERIFICATION_TOO_MANY_REQUESTS_BODY
        : errorMessage?.trim() ||
          "確認メールを送れませんでした。時間をおいて『確認メールを再送』を押してください。";
    return {
      heading: EMAIL_VERIFICATION_ERROR_HEADING,
      showSentSuccessClaim: false,
      steps: null,
      welcomeDistinction: EMAIL_VERIFICATION_WELCOME_DISTINCT_ERROR,
      spamHint: null,
      statusLine: null,
      alertMessage: alert,
      primaryAction: "resend",
    };
  }

  if (phase === "sending") {
    return {
      heading: EMAIL_VERIFICATION_SENDING_HEADING,
      showSentSuccessClaim: false,
      steps: null,
      welcomeDistinction: EMAIL_VERIFICATION_WELCOME_DISTINCT_SENT,
      spamHint: null,
      statusLine: "確認メールを送信しています…",
      alertMessage: null,
      primaryAction: "check",
    };
  }

  if (phase === "checking") {
    return {
      heading: EMAIL_VERIFICATION_CHECKING_HEADING,
      showSentSuccessClaim: false,
      steps: EMAIL_VERIFICATION_SENT_STEPS,
      welcomeDistinction: EMAIL_VERIFICATION_WELCOME_DISTINCT_SENT,
      spamHint: "届かない場合は迷惑メールフォルダもご確認ください。",
      statusLine: "確認状態を調べています…",
      alertMessage: null,
      primaryAction: "check",
    };
  }

  // sent | verified (verified handoff is brief; keep sent guidance)
  return {
    heading: EMAIL_VERIFICATION_SENT_HEADING,
    showSentSuccessClaim: true,
    steps: EMAIL_VERIFICATION_SENT_STEPS,
    welcomeDistinction: EMAIL_VERIFICATION_WELCOME_DISTINCT_SENT,
    spamHint: "届かない場合は迷惑メールフォルダもご確認ください。",
    statusLine: null,
    alertMessage: null,
    primaryAction: "check",
  };
}

/** True if rendered copy would claim a successful verification send. */
export function claimsVerificationEmailSent(ui: EmailVerificationPendingUiModel): boolean {
  return ui.showSentSuccessClaim || ui.heading === EMAIL_VERIFICATION_SENT_HEADING;
}
