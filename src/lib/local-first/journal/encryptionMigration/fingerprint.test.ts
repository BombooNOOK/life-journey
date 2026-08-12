import { describe, expect, it } from "vitest";

import {
  compareFingerprints,
  missingExpectedTables,
  sha256Hex,
  unexpectedTables,
} from "@/lib/local-first/journal/encryptionMigration/fingerprint";
import type { MigrationFingerprint } from "@/lib/local-first/journal/encryptionMigration/types";

function fp(partial?: Partial<MigrationFingerprint>): MigrationFingerprint {
  return {
    userVersion: 1,
    tables: ["local_journal_entries", "local_journal_tags", "local_media"],
    rowCounts: {
      local_journal_entries: 1,
      local_journal_tags: 0,
      local_media: 0,
    },
    columns: {
      local_journal_entries: ["stable_id", "content"],
      local_journal_tags: ["journal_stable_id", "tag"],
      local_media: ["stable_id", "relative_path"],
    },
    entries: [
      {
        stableId: "a",
        legacyServerId: null,
        dateKey: "2026-08-01",
        contentHash: "abc",
        tags: [],
        media: [],
      },
    ],
    ...partial,
  };
}

describe("encryption migration fingerprints", () => {
  it("hashes content stably without exposing plaintext", async () => {
    const a = await sha256Hex("LJD_ENC_MIG_FIXTURE 日本語");
    const b = await sha256Hex("LJD_ENC_MIG_FIXTURE 日本語");
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it("detects unexpected/missing tables for schema inventory", () => {
    expect(unexpectedTables(["local_journal_entries", "sqlite_stat1"])).toEqual([
      "sqlite_stat1",
    ]);
    expect(missingExpectedTables(["local_journal_entries"])).toEqual([
      "local_journal_tags",
      "local_media",
    ]);
  });

  it("passes identical fingerprints and aborts on content hash mismatch", () => {
    expect(compareFingerprints(fp(), fp()).ok).toBe(true);
    const mismatch = compareFingerprints(
      fp(),
      fp({
        entries: [
          {
            stableId: "a",
            legacyServerId: null,
            dateKey: "2026-08-01",
            contentHash: "CHANGED",
            tags: [],
            media: [],
          },
        ],
      }),
    );
    expect(mismatch.ok).toBe(false);
    expect(mismatch.mismatches).toContain("contentHash");
  });

  it("aborts when schema columns drift", () => {
    const drifted = compareFingerprints(
      fp(),
      fp({
        columns: {
          local_journal_entries: ["stable_id", "content", "extra"],
          local_journal_tags: ["journal_stable_id", "tag"],
          local_media: ["stable_id", "relative_path"],
        },
      }),
    );
    expect(drifted.ok).toBe(false);
    expect(drifted.mismatches).toContain("columns:local_journal_entries");
  });
});
