import { describe, expect, it } from "vitest";

import {
  BACKUP_INCLUSION_POLICY,
  shouldForceBackupInclusion,
} from "@/lib/local-first/security/backupInclusion";

describe("backup inclusion policy", () => {
  it("recommends after_directory_create and not every launch", () => {
    expect(BACKUP_INCLUSION_POLICY.recommendedTiming).toBe(
      "after_directory_create",
    );
    expect(BACKUP_INCLUSION_POLICY.applyEveryLaunch).toBe(false);
  });

  it("rewrites only when currently excluded", () => {
    expect(shouldForceBackupInclusion(true)).toBe(true);
    expect(shouldForceBackupInclusion(false)).toBe(false);
    expect(shouldForceBackupInclusion("unset")).toBe(false);
    expect(shouldForceBackupInclusion("api_unavailable")).toBe(false);
  });
});
