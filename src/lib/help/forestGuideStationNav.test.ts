import { describe, expect, it } from "vitest";

import {
  buildForestGuideStationHref,
  resolveForestGuideStationBackLink,
} from "@/lib/help/forestGuideStationNav";

describe("forestGuideStationNav", () => {
  it("builds href with returnTo and hash", () => {
    expect(buildForestGuideStationHref({ returnTo: "/orders", hash: "diary-book" })).toBe(
      "/help/ljd?returnTo=%2Forders#diary-book",
    );
  });

  it("resolves tour return label", () => {
    expect(resolveForestGuideStationBackLink("/orders")).toEqual({
      href: "/orders",
      label: "ログハウスの案内に戻る",
    });
    expect(resolveForestGuideStationBackLink(null)).toBeNull();
  });
});
