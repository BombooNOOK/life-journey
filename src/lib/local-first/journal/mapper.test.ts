import { describe, expect, it } from "vitest";

import { RAIN_FOREST_SERVER_FIXTURE } from "@/lib/local-first/journal/fixture";
import { mapServerJournalEntryLikeToLocal } from "@/lib/local-first/journal/mapper";

describe("mapServerJournalEntryLikeToLocal", () => {
  it("maps fixture to LocalJournalEntry with legacyServerId and relative media", () => {
    const local = mapServerJournalEntryLikeToLocal(RAIN_FOREST_SERVER_FIXTURE, {
      journalStableId: "01TESTJOURNALSTABLEID00001",
      mediaStableId: "01TESTMEDIASTABLEID0000001",
      mediaRelativePath: "ljd/media/journal/rain.png",
      mediaChecksum: "abc",
    });

    expect(local.stableId).toBe("01TESTJOURNALSTABLEID00001");
    expect(local.legacyServerId).toBe(RAIN_FOREST_SERVER_FIXTURE.id);
    expect(local.title).toBe("雨あがりの森");
    expect(local.dateKey).toBe("2026-08-10");
    expect(local.tags).toEqual(["#雨", "#森"]);
    expect(local.mediaRefs).toHaveLength(1);
    expect(local.mediaRefs[0]?.relativePath).toBe("ljd/media/journal/rain.png");
    expect(local.mediaRefs[0]?.relativePath.includes("/var/mobile")).toBe(false);
  });
});
