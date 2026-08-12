import { describe, expect, it } from "vitest";

import { isCompleteProtection } from "@/lib/local-first/security/fileProtection";
import { LJD_FILE_PROTECTION_CANDIDATE } from "@/lib/local-first/security/types";

describe("file protection labels", () => {
  it("accepts Complete as the production candidate label", () => {
    expect(isCompleteProtection(LJD_FILE_PROTECTION_CANDIDATE)).toBe(true);
    expect(
      isCompleteProtection(
        "NSFileProtectionCompleteUntilFirstUserAuthentication",
      ),
    ).toBe(false);
  });

  it("does not treat attribute-label equality as lock-denial proof", () => {
    // Lock-while-locked access denial is Release Gate RG-1, not this unit test.
    expect(isCompleteProtection("NSFileProtectionComplete")).toBe(true);
  });
});
