/** パスワード再設定メール送信後の案内（ログイン画面・マイページ共通） */

const PASSWORD_RESET_SENT_NOTICE_LINES = [
  "パスワード再設定メールを送信しました。",
  "メールが届かない場合は、迷惑メールフォルダもご確認ください。",
  "しばらくしても届かない場合は、登録時と異なるメールアドレスを入力している可能性があります。",
] as const;

/** 画面に表示する想定送信元（Resend / Firebase SMTP 設定後に Vercel で設定） */
function readTransactionalEmailFromLabel(): string | null {
  const raw = process.env.NEXT_PUBLIC_TRANSACTIONAL_EMAIL_FROM?.trim();
  if (!raw) return null;
  const match = raw.match(/<([^>]+)>/);
  return (match?.[1] ?? raw).trim() || null;
}

export function getPasswordResetSentNotice(): string {
  const from = readTransactionalEmailFromLabel();
  const lines: string[] = [...PASSWORD_RESET_SENT_NOTICE_LINES];
  if (from) {
    lines.push(`送信元の表示：${from}`);
    lines.push("迷惑メールに入った場合は「迷惑メールではない」を選ぶと、次回から届きやすくなります。");
  }
  return lines.join("\n");
}

/** @deprecated 互換用。動的文案は getPasswordResetSentNotice() を使う */
export const PASSWORD_RESET_SENT_NOTICE = PASSWORD_RESET_SENT_NOTICE_LINES.join("\n");
