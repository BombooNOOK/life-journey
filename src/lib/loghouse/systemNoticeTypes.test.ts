import { describe, expect, it } from "vitest";

import {
  parseSystemNoticeMailboxId,
  toSystemNoticeMailboxId,
} from "@/lib/loghouse/systemNoticeTypes";

describe("systemNoticeTypes", () => {
  it("round-trips mailbox ids", () => {
    expect(toSystemNoticeMailboxId("abc")).toBe("sys:abc");
    expect(parseSystemNoticeMailboxId("sys:abc")).toBe("abc");
    expect(parseSystemNoticeMailboxId("personal-id")).toBeNull();
  });
});
