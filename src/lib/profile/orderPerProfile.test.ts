import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { journalProfileIdsForQuery } from "@/lib/profile/activeProfile";

describe("journalProfileIdsForQuery", () => {
  it("includes legacy empty profileId for default legacy profile", () => {
    const email = "test@example.com";
    const legacyId = `legacy:${createHash("md5").update(email).digest("hex")}`;
    expect(journalProfileIdsForQuery(legacyId, email)).toEqual([legacyId, ""]);
  });

  it("uses only exact profile id for non-legacy profiles", () => {
    expect(journalProfileIdsForQuery("profile-abc", "test@example.com")).toEqual(["profile-abc"]);
  });
});
