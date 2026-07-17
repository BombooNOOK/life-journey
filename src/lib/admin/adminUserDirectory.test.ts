import { describe, expect, it } from "vitest";

import {
  compareAdminDirectoryRows,
  emailAlphabetBucket,
  matchesAdminDirectoryFilters,
  pickRandomEmails,
  type AdminDirectoryFilterable,
} from "@/lib/admin/adminUserDirectory";

function row(
  partial: Partial<AdminDirectoryFilterable> & { email: string },
): AdminDirectoryFilterable {
  return {
    memberNumber: 1,
    registeredAt: null,
    subscriberPdfAccess: false,
    sourceOrderCount: 0,
    sourceJournalCount: 0,
    isAdmin: false,
    isMonitor: false,
    profileIds: ["p1"],
    ...partial,
  };
}

describe("adminUserDirectory", () => {
  it("buckets by first letter", () => {
    expect(emailAlphabetBucket("alice@example.com")).toBe("A");
    expect(emailAlphabetBucket("Bob@example.com")).toBe("B");
    expect(emailAlphabetBucket("1user@example.com")).toBe("#");
    expect(emailAlphabetBucket(".odd@example.com")).toBe("#");
  });

  it("sorts by memberNumber then registeredAt", () => {
    const rows = [
      { memberNumber: 3, registeredAt: "2026-01-03T00:00:00.000Z", email: "c@x.com" },
      { memberNumber: 1, registeredAt: "2026-01-01T00:00:00.000Z", email: "a@x.com" },
      { memberNumber: 2, registeredAt: "2026-01-02T00:00:00.000Z", email: "b@x.com" },
    ];
    const asc = [...rows].sort((a, b) => compareAdminDirectoryRows(a, b, "asc"));
    expect(asc.map((r) => r.memberNumber)).toEqual([1, 2, 3]);
    const desc = [...rows].sort((a, b) => compareAdminDirectoryRows(a, b, "desc"));
    expect(desc.map((r) => r.memberNumber)).toEqual([3, 2, 1]);
  });

  it("filters by plan / kantei / audience", () => {
    const light = row({
      email: "light@x.com",
      subscriberPdfAccess: true,
      sourceOrderCount: 2,
    });
    const free = row({ email: "free@x.com", sourceOrderCount: 0 });
    const admin = row({ email: "admin@x.com", isAdmin: true, sourceOrderCount: 1 });

    expect(
      matchesAdminDirectoryFilters(light, {
        plan: "light",
        hasKantei: "all",
        hasJournal: "all",
        audience: "all",
        sendableOnly: false,
      }),
    ).toBe(true);
    expect(
      matchesAdminDirectoryFilters(free, {
        plan: "light",
        hasKantei: "all",
        hasJournal: "all",
        audience: "all",
        sendableOnly: false,
      }),
    ).toBe(false);
    expect(
      matchesAdminDirectoryFilters(free, {
        plan: "all",
        hasKantei: "yes",
        hasJournal: "all",
        audience: "all",
        sendableOnly: false,
      }),
    ).toBe(false);
    expect(
      matchesAdminDirectoryFilters(admin, {
        plan: "all",
        hasKantei: "all",
        hasJournal: "all",
        audience: "customers",
        sendableOnly: false,
      }),
    ).toBe(false);
  });

  it("picks random emails without exceeding n", () => {
    const rows = [
      { email: "a@x.com" },
      { email: "b@x.com" },
      { email: "c@x.com" },
    ];
    expect(pickRandomEmails(rows, 2)).toHaveLength(2);
    expect(pickRandomEmails(rows, 10)).toHaveLength(3);
    expect(pickRandomEmails(rows, 0)).toEqual([]);
  });
});
