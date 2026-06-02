import { describe, expect, it } from "vitest";

import {
  bookBindingAdminFilterHref,
  bookBindingStatusWhereClause,
  isBookBindingStatusFilterActive,
  openStatusTotal,
  mapStatusCounts,
} from "./bookBindingAdminFilter";

describe("bookBindingStatusWhereClause", () => {
  it("open includes pending, ordered, in_production", () => {
    expect(bookBindingStatusWhereClause("open")).toEqual({
      status: { in: ["pending", "ordered", "in_production"] },
    });
  });

  it("all returns empty clause", () => {
    expect(bookBindingStatusWhereClause("all")).toEqual({});
    expect(bookBindingStatusWhereClause("")).toEqual({});
  });

  it("shipped and cancelled are single status", () => {
    expect(bookBindingStatusWhereClause("shipped")).toEqual({ status: "shipped" });
    expect(bookBindingStatusWhereClause("cancelled")).toEqual({ status: "cancelled" });
  });
});

describe("bookBindingAdminFilterHref", () => {
  it("builds status and q query", () => {
    expect(
      bookBindingAdminFilterHref("/admin/diary-book-binding", {
        status: "pending",
        q: "test@",
      }),
    ).toBe("/admin/diary-book-binding?status=pending&q=test%40");
  });

  it("omits all status", () => {
    expect(bookBindingAdminFilterHref("/admin/diary-book-binding", { status: "all" })).toBe(
      "/admin/diary-book-binding",
    );
  });
});

describe("isBookBindingStatusFilterActive", () => {
  it("matches open and pending", () => {
    expect(isBookBindingStatusFilterActive("open", "open")).toBe(true);
    expect(isBookBindingStatusFilterActive("pending", "pending")).toBe(true);
    expect(isBookBindingStatusFilterActive("open", "pending")).toBe(false);
  });
});

describe("mapStatusCounts", () => {
  it("sums open statuses", () => {
    const counts = mapStatusCounts([
      { status: "pending", _count: { id: 3 } },
      { status: "ordered", _count: { id: 2 } },
      { status: "in_production", _count: { id: 1 } },
      { status: "shipped", _count: { id: 10 } },
    ]);
    expect(openStatusTotal(counts)).toBe(6);
  });
});
