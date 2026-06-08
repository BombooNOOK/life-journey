export type SupportInquiryReplyContext = {
  userEmail: string;
  categoryLabel: string;
  createdAtLabel: string;
  activeProfileName: string | null;
};

export function buildSupportInquiryReplySubject(categoryLabel: string): string {
  return `【BambooNOOK】お問い合わせについて（${categoryLabel}）`;
}

export function buildSupportInquiryReplyBody(ctx: SupportInquiryReplyContext): string {
  const profileName = ctx.activeProfileName?.trim() || "—";
  return `お問い合わせありがとうございます。
BambooNOOK運営です。

以下の件についてご連絡いたします。

---
お問い合わせ種別：${ctx.categoryLabel}
受付日時：${ctx.createdAtLabel}
プロフィール名：${profileName}
---

`;
}

export function buildGmailComposeUrl(input: {
  to: string;
  subject: string;
  body: string;
}): string {
  const to = encodeURIComponent(input.to);
  const su = encodeURIComponent(input.subject);
  const body = encodeURIComponent(input.body);
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${body}`;
}

export function buildMailtoReplyUrl(input: {
  to: string;
  subject: string;
  body: string;
}): string {
  const subject = encodeURIComponent(input.subject);
  const body = encodeURIComponent(input.body);
  return `mailto:${input.to}?subject=${subject}&body=${body}`;
}

export function buildSupportInquiryReplyLinks(ctx: SupportInquiryReplyContext): {
  subject: string;
  body: string;
  gmailUrl: string;
  mailtoUrl: string;
} {
  const subject = buildSupportInquiryReplySubject(ctx.categoryLabel);
  const body = buildSupportInquiryReplyBody(ctx);
  return {
    subject,
    body,
    gmailUrl: buildGmailComposeUrl({ to: ctx.userEmail, subject, body }),
    mailtoUrl: buildMailtoReplyUrl({ to: ctx.userEmail, subject, body }),
  };
}
