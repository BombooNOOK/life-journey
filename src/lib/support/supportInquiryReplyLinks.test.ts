import { describe, expect, it } from "vitest";

import {
  buildGmailComposeUrl,
  buildMailtoReplyUrl,
  buildSupportInquiryReplyBody,
  buildSupportInquiryReplyLinks,
  buildSupportInquiryReplySubject,
} from "@/lib/support/supportInquiryReplyLinks";

describe("supportInquiryReplyLinks", () => {
  const ctx = {
    userEmail: "user@example.com",
    categoryLabel: "プロフィール削除について",
    createdAtLabel: "2026/6/8 18:00:00",
    activeProfileName: "自分",
  };

  it("builds subject with category label", () => {
    expect(buildSupportInquiryReplySubject("その他")).toBe(
      "【BambooNOOK】お問い合わせについて（その他）",
    );
  });

  it("builds body template with inquiry context", () => {
    const body = buildSupportInquiryReplyBody(ctx);
    expect(body).toContain("お問い合わせありがとうございます。");
    expect(body).toContain("お問い合わせ種別：プロフィール削除について");
    expect(body).toContain("受付日時：2026/6/8 18:00:00");
    expect(body).toContain("プロフィール名：自分");
  });

  it("uses dash for missing profile name", () => {
    const body = buildSupportInquiryReplyBody({ ...ctx, activeProfileName: null });
    expect(body).toContain("プロフィール名：—");
  });

  it("builds Gmail compose URL with encoded params", () => {
    const url = buildGmailComposeUrl({
      to: "user@example.com",
      subject: "【BambooNOOK】テスト",
      body: "本文\n改行",
    });
    expect(url).toMatch(/^https:\/\/mail\.google\.com\/mail\/\?/);
    expect(url).toContain("view=cm");
    expect(url).toContain("fs=1");
    expect(url).toContain(`to=${encodeURIComponent("user@example.com")}`);
    expect(url).toContain(`su=${encodeURIComponent("【BambooNOOK】テスト")}`);
    expect(url).toContain(`body=${encodeURIComponent("本文\n改行")}`);
  });

  it("builds mailto URL with encoded subject and body", () => {
    const url = buildMailtoReplyUrl({
      to: "user@example.com",
      subject: "件名",
      body: "本文",
    });
    expect(url).toBe(
      `mailto:user@example.com?subject=${encodeURIComponent("件名")}&body=${encodeURIComponent("本文")}`,
    );
  });

  it("builds all reply links together", () => {
    const links = buildSupportInquiryReplyLinks(ctx);
    expect(links.gmailUrl).toContain("mail.google.com");
    expect(links.mailtoUrl.startsWith("mailto:user@example.com?")).toBe(true);
    expect(links.subject).toContain("プロフィール削除について");
  });
});
