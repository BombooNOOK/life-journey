import type { MailboxNoticeView } from "@/lib/loghouse/mailboxNoticeTypes";
import { MAILBOX_NOTICE_TYPE_FORTUNE_REPORT_READY } from "@/lib/loghouse/mailboxNoticeTypes";
import {
  mailboxDateLabel,
  mailboxMessagePreview,
  presentMailboxNotice,
} from "@/lib/loghouse/mailboxPresentation";
import { calendarDayKeyInJapanFromDate } from "@/lib/date/japanCalendarDate";
import { describe, expect, it } from "vitest";

describe("mailboxPresentation", () => {
  it("builds a one-line preview", () => {
    expect(mailboxMessagePreview("短いお手紙です。")).toBe("短いお手紙です。");
    expect(
      mailboxMessagePreview(
        "今日もログハウスに来てくれてありがとう。\n森で過ごした時間が、やさしい1日につながりますように。",
        20,
      ),
    ).toBe("今日もログハウスに来てくれてありがとう。…");
  });

  it("labels today and yesterday in Japan calendar", () => {
    const todayKey = calendarDayKeyInJapanFromDate(new Date("2026-07-16T12:00:00+09:00"));
    expect(todayKey).toBe("2026-07-16");
    expect(mailboxDateLabel("2026-07-16T03:00:00.000Z", new Date("2026-07-16T12:00:00+09:00"))).toBe(
      "今日",
    );
    expect(mailboxDateLabel("2026-07-15T03:00:00.000Z", new Date("2026-07-16T12:00:00+09:00"))).toBe(
      "昨日",
    );
  });

  it("presents fortune delivery with 鑑定のへや", () => {
    const notice: MailboxNoticeView = {
      id: "n1",
      type: MAILBOX_NOTICE_TYPE_FORTUNE_REPORT_READY,
      title: "古いタイトル",
      message: "あなたの鑑定書が本棚に届いています。",
      actionLabel: "本棚で見る",
      actionRoute: "/orders/bookshelf",
      relatedOrderId: "o1",
      relatedLedgerId: null,
      createdAt: "2026-07-16T03:00:00.000Z",
      readAt: null,
      unread: true,
    };
    const presented = presentMailboxNotice(notice, new Date("2026-07-16T12:00:00+09:00"));
    expect(presented.senderName).toBe("鑑定のへや");
    expect(presented.title).toBe("鑑定書が届きました");
    expect(presented.kind).toBe("delivery");
    expect(presented.isRead).toBe(false);
  });
});
