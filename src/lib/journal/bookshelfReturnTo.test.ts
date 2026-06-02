import { describe, expect, it } from "vitest";

import { parseSafeJournalReturnTo } from "./bookshelfReturnTo";

describe("parseSafeJournalReturnTo", () => {
  it("allows calendar home without query", () => {
    expect(parseSafeJournalReturnTo("/orders/calendar")).toBe("/orders/calendar");
  });

  it("allows calendar home with valid day", () => {
    expect(parseSafeJournalReturnTo("/orders/calendar?day=2026-05-22")).toBe(
      "/orders/calendar?day=2026-05-22",
    );
  });

  it("rejects open redirect", () => {
    expect(parseSafeJournalReturnTo("//evil.example")).toBeNull();
  });

  it("still allows bookshelf diary return", () => {
    expect(parseSafeJournalReturnTo("/orders/bookshelf/diary/2026?p=2")).toBe(
      "/orders/bookshelf/diary/2026?p=2",
    );
  });

  it("allows diary book return with page", () => {
    expect(
      parseSafeJournalReturnTo("/orders/bookshelf/diary-book/clxyz1234567890?p=3"),
    ).toBe("/orders/bookshelf/diary-book/clxyz1234567890?p=3");
  });

  it("rejects diary book return with invalid id", () => {
    expect(parseSafeJournalReturnTo("/orders/bookshelf/diary-book/../evil")).toBeNull();
  });
});
