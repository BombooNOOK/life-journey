const DEFAULT_FROM = "BambooNOOK <onboarding@resend.dev>";

export type SendSupportInquiryReplyEmailInput = {
  toEmail: string;
  categoryLabel: string;
  replyBody: string;
  threadUrl: string;
};

export type SendSupportInquiryReplyEmailResult =
  | { sent: true }
  | { sent: false; skipped?: boolean; reason?: string; error?: string };

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function sendSupportInquiryReplyEmail(
  input: SendSupportInquiryReplyEmailInput,
): Promise<SendSupportInquiryReplyEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false, skipped: true, reason: "RESEND_API_KEY not configured" };
  }

  const from =
    process.env.RESEND_SUPPORT_FROM?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    DEFAULT_FROM;
  const subject = `【BambooNOOK】お問い合わせへの返信（${input.categoryLabel}）`;
  const safeBody = escapeHtml(input.replyBody).replaceAll("\n", "<br />");

  const html = `
    <div style="font-family: sans-serif; line-height: 1.7; color: #44403c; max-width: 32rem;">
      <p style="font-size: 16px;">お問い合わせありがとうございます。BambooNOOK運営より返信いたします。</p>
      <div style="margin: 1.25rem 0; padding: 1rem; border-radius: 0.5rem; background: #fafaf9; border: 1px solid #e7e5e4; font-size: 15px;">
        ${safeBody}
      </div>
      <p style="font-size: 15px;">
        ログハウスでも会話を続けられます。<br />
        <a href="${escapeHtml(input.threadUrl)}" style="color: #065f46;">お問い合わせの詳細を開く</a>
      </p>
      <p style="font-size: 14px; color: #78716c;">BambooNOOK / Life Journey Diary</p>
    </div>
  `.trim();

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.toEmail],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("[support-inquiry-reply-email] Resend error:", res.status, detail);
      return { sent: false, error: "send failed" };
    }

    return { sent: true };
  } catch (error) {
    console.error("[support-inquiry-reply-email]", error);
    return { sent: false, error: "send failed" };
  }
}
