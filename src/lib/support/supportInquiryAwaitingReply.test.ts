import { describe, expect, it } from "vitest";

import {
  compareSupportInquiriesForAdminList,
  isSupportInquiryAwaitingAdminReply,
} from "@/lib/support/supportInquiryAwaitingReply";

describe("isSupportInquiryAwaitingAdminReply", () => {
  it("returns true when last message is from user and inquiry is open", () => {
    expect(
      isSupportInquiryAwaitingAdminReply({ status: "pending", lastMessageRole: "user" }),
    ).toBe(true);
    expect(
      isSupportInquiryAwaitingAdminReply({ status: "in_progress", lastMessageRole: "user" }),
    ).toBe(true);
  });

  it("returns false when last message is from admin", () => {
    expect(
      isSupportInquiryAwaitingAdminReply({ status: "pending", lastMessageRole: "admin" }),
    ).toBe(false);
  });

  it("returns false when inquiry is closed", () => {
    expect(
      isSupportInquiryAwaitingAdminReply({ status: "closed", lastMessageRole: "user" }),
    ).toBe(false);
  });
});

describe("compareSupportInquiriesForAdminList", () => {
  it("puts awaiting replies first, then sorts by updatedAt desc", () => {
    const awaitingOlder = {
      awaitingAdminReply: true,
      updatedAt: new Date("2026-06-01T10:00:00Z"),
    };
    const awaitingNewer = {
      awaitingAdminReply: true,
      updatedAt: new Date("2026-06-02T10:00:00Z"),
    };
    const done = {
      awaitingAdminReply: false,
      updatedAt: new Date("2026-06-03T10:00:00Z"),
    };

    const sorted = [done, awaitingOlder, awaitingNewer].sort(compareSupportInquiriesForAdminList);
    expect(sorted).toEqual([awaitingNewer, awaitingOlder, done]);
  });
});
