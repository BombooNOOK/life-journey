import { describe, expect, it } from "vitest";

import { diaryBookBindingStatusWhereClause } from "./diaryBookBindingAdminFilter";

describe("diaryBookBindingStatusWhereClause", () => {
  const now = new Date("2026-06-10T12:00:00.000Z");

  it("default all hides expired and cancelled while keeping visible pending", () => {
    const clause = diaryBookBindingStatusWhereClause("all", now);
    expect(clause).toEqual({
      OR: [
        { status: { in: ["ordered", "in_production", "shipped"] } },
        {
          status: "pending",
          NOT: {
            status: "pending",
            OR: [{ baseOrderNumber: null }, { baseOrderNumber: "" }],
            createdAt: { lt: new Date("2026-06-03T12:00:00.000Z") },
          },
        },
      ],
    });
  });

  it("open includes actionable pending and in-flight statuses", () => {
    const clause = diaryBookBindingStatusWhereClause("open", now);
    expect(clause).toEqual({
      OR: [
        { status: { in: ["ordered", "in_production"] } },
        {
          status: "pending",
          NOT: {
            status: "pending",
            OR: [{ baseOrderNumber: null }, { baseOrderNumber: "" }],
            createdAt: { lt: new Date("2026-06-03T12:00:00.000Z") },
          },
        },
      ],
    });
  });

  it("expired filter shows only expired rows", () => {
    expect(diaryBookBindingStatusWhereClause("expired", now)).toEqual({ status: "expired" });
  });
});
