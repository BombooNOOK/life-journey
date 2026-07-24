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

  it("allows diary book edit-includes return", () => {
    expect(
      parseSafeJournalReturnTo("/orders/bookshelf/diary-book/clxyz1234567890/edit-includes"),
    ).toBe("/orders/bookshelf/diary-book/clxyz1234567890/edit-includes");
  });

  it("allows diary book edit-period and edit-tags return", () => {
    expect(
      parseSafeJournalReturnTo("/orders/bookshelf/diary-book/clxyz1234567890/edit-period"),
    ).toBe("/orders/bookshelf/diary-book/clxyz1234567890/edit-period");
    expect(
      parseSafeJournalReturnTo("/orders/bookshelf/diary-book/clxyz1234567890/edit-tags"),
    ).toBe("/orders/bookshelf/diary-book/clxyz1234567890/edit-tags");
  });

  it("rejects diary book edit subpath with query", () => {
    expect(
      parseSafeJournalReturnTo(
        "/orders/bookshelf/diary-book/clxyz1234567890/edit-includes?evil=1",
      ),
    ).toBe("/orders/bookshelf/diary-book/clxyz1234567890/edit-includes");
  });

  it("rejects diary book return with invalid id", () => {
    expect(parseSafeJournalReturnTo("/orders/bookshelf/diary-book/../evil")).toBeNull();
  });

  it("allows journal preview return with entry id", () => {
    expect(
      parseSafeJournalReturnTo(
        "/journal/preview?entry=clxyz1234567890&theme=simple_plain&pv=3",
      ),
    ).toBe("/journal/preview?entry=clxyz1234567890&pv=3&theme=simple_plain");
  });

  it("allows journal list return with month", () => {
    expect(parseSafeJournalReturnTo("/orders/list?month=2026-08")).toBe("/orders/list?month=2026-08");
  });

  it("allows bookshelf home return", () => {
    expect(parseSafeJournalReturnTo("/orders/bookshelf")).toBe("/orders/bookshelf");
  });

  it("allows bookshelf create resume return", () => {
    expect(parseSafeJournalReturnTo("/orders/bookshelf?createBook=1")).toBe(
      "/orders/bookshelf?createBook=1",
    );
  });

  it("rejects bookshelf home with unknown query", () => {
    expect(parseSafeJournalReturnTo("/orders/bookshelf?evil=1")).toBeNull();
  });
});
