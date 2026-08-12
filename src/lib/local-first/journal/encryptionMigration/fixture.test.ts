import { describe, expect, it } from "vitest";

import {
  buildEncryptionMigrationFixtureEntries,
  isFixtureStableId,
} from "@/lib/local-first/journal/encryptionMigration/fixture";
import { LOCAL_JOURNAL_DB_NAME } from "@/lib/local-first/journal/types";

describe("encryption migration fixture", () => {
  it("covers required shapes without personal data", () => {
    const entries = buildEncryptionMigrationFixtureEntries();
    expect(entries.length).toBeGreaterThanOrEqual(3);
    expect(entries.some((e) => e.legacyServerId)).toBe(true);
    expect(entries.some((e) => e.legacyServerId == null)).toBe(true);
    expect(entries.some((e) => e.tags.length === 0)).toBe(true);
    expect(entries.some((e) => e.tags.length > 1)).toBe(true);
    expect(entries.every((e) => /[\u3040-\u30ff\u4e00-\u9faf]/.test(e.content))).toBe(
      true,
    );
    expect(entries.every((e) => isFixtureStableId(e.stableId))).toBe(true);
  });

  it("never uses the production journal name", () => {
    expect(LOCAL_JOURNAL_DB_NAME).toBe("ljd_local_journal");
    expect(isFixtureStableId(LOCAL_JOURNAL_DB_NAME)).toBe(false);
  });
});
