import { describe, expect, it } from "vitest";

import {
  isConfiguredRelativeLocation,
  pluginRelativeLocationForBundleId,
} from "@/lib/local-first/security/storageLocation";
import { LJD_IOS_DATABASE_RELATIVE_LOCATION } from "@/lib/local-first/security/types";

describe("storage location helpers", () => {
  it("builds relative Application Support path from bundle id (no absolute hardcode)", () => {
    expect(pluginRelativeLocationForBundleId("app.bamboonook.ljd")).toBe(
      LJD_IOS_DATABASE_RELATIVE_LOCATION,
    );
    expect(pluginRelativeLocationForBundleId("app.bamboonook.ljd")).not.toMatch(
      /^\/var\/mobile/,
    );
  });

  it("recognizes the configured relative location", () => {
    expect(
      isConfiguredRelativeLocation("Library/Application Support/app.bamboonook.ljd"),
    ).toBe(true);
    expect(isConfiguredRelativeLocation("Library/CapacitorDatabase")).toBe(false);
  });
});
