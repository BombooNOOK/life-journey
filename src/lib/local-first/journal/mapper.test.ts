import { describe, expect, it } from "vitest";

import { SERVER_JOURNAL_SHAPE_FIXTURE } from "@/lib/local-first/journal/__fixtures__/serverJournalShape";
import {
  mapServerJournalEntryLikeToLocal,
  normalizeLocalJournalTags,
} from "@/lib/local-first/journal/mapper";
import { createLocalStableId } from "@/lib/local-first/journal/stableId";

describe("mapServerJournalEntryLikeToLocal", () => {
  it("maps server-like shape to LocalJournalEntry with legacyServerId and relative media", () => {
    const local = mapServerJournalEntryLikeToLocal(SERVER_JOURNAL_SHAPE_FIXTURE, {
      journalStableId: "01TESTJOURNALSTABLEID00001",
      mediaStableId: "01TESTMEDIASTABLEID0000001",
      mediaRelativePath: "ljd/media/journal/rain.png",
      mediaChecksum: "abc",
    });

    expect(local.stableId).toBe("01TESTJOURNALSTABLEID00001");
    expect(local.legacyServerId).toBe(SERVER_JOURNAL_SHAPE_FIXTURE.id);
    expect(local.title).toBe("雨あがりの森");
    expect(local.dateKey).toBe("2026-08-10");
    expect(local.tags).toEqual(["#雨", "#森"]);
    expect(local.mediaRefs).toHaveLength(1);
    expect(local.mediaRefs[0]?.relativePath).toBe("ljd/media/journal/rain.png");
    expect(local.mediaRefs[0]?.relativePath.includes("/var/mobile")).toBe(false);
    expect(local.serverUpdatedAt).toBe(SERVER_JOURNAL_SHAPE_FIXTURE.updatedAt);
  });

  it("sets migrated_server source and keeps timestamps for future conflict detection", () => {
    const local = mapServerJournalEntryLikeToLocal(SERVER_JOURNAL_SHAPE_FIXTURE, {
      journalStableId: "01TESTJOURNALSTABLEID00002",
      source: "migrated_server",
      importedAt: "2026-08-11T00:00:00.000Z",
    });
    expect(local.source).toBe("migrated_server");
    expect(local.legacyServerId).toBe(SERVER_JOURNAL_SHAPE_FIXTURE.id);
    expect(local.importedAt).toBe("2026-08-11T00:00:00.000Z");
    expect(local.serverUpdatedAt).toBe(SERVER_JOURNAL_SHAPE_FIXTURE.updatedAt);
  });
});

describe("normalizeLocalJournalTags", () => {
  it("ensures # prefix and dedupes", () => {
    expect(normalizeLocalJournalTags(["雨", "#森", "#雨", "  "])).toEqual(["#雨", "#森"]);
  });
});

describe("createLocalStableId", () => {
  it("returns ULID-like unique strings", () => {
    const a = createLocalStableId();
    const b = createLocalStableId();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(20);
  });
});

describe("relative path + dedupe contract", () => {
  it("stores relative media paths only (no absolute device roots)", () => {
    const local = mapServerJournalEntryLikeToLocal(SERVER_JOURNAL_SHAPE_FIXTURE, {
      mediaRelativePath: "ljd/media/journal/x.jpg",
      mediaChecksum: "deadbeef",
    });
    for (const m of local.mediaRefs) {
      expect(m.relativePath.startsWith("ljd/")).toBe(true);
      expect(m.relativePath.includes("/var/")).toBe(false);
      expect(m.checksum).toBe("deadbeef");
    }
  });

  it("documents legacyServerId as migration dedupe key", () => {
    const first = mapServerJournalEntryLikeToLocal(SERVER_JOURNAL_SHAPE_FIXTURE, {
      journalStableId: "01AAAA",
      source: "migrated_server",
    });
    const second = mapServerJournalEntryLikeToLocal(SERVER_JOURNAL_SHAPE_FIXTURE, {
      journalStableId: "01BBBB",
      source: "migrated_server",
    });
    expect(first.legacyServerId).toBe(second.legacyServerId);
    expect(first.stableId).not.toBe(second.stableId);
  });
});
