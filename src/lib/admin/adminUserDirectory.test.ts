import { describe, expect, it } from "vitest";

import {
  compareAdminDirectoryRows,
  emailAlphabetBucket,
} from "@/lib/admin/adminUserDirectory";

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
});
