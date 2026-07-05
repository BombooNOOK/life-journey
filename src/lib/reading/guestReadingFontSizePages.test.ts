import { describe, expect, it } from "vitest";

import {
  findGuestReadingFontSizePageByPathname,
  guestReadingFontSizeHref,
} from "@/lib/reading/guestReadingFontSizePages";

describe("guestReadingFontSizePages", () => {
  it("finds configured guest pages", () => {
    expect(findGuestReadingFontSizePageByPathname("/guide")?.sectionId).toBe("guide-font-size");
    expect(findGuestReadingFontSizePageByPathname("/contact")?.sectionId).toBe("contact-font-size");
  });

  it("falls back to reading-font-size page for other pages", () => {
    expect(guestReadingFontSizeHref("/login")).toBe(
      "/settings/reading-font-size?returnTo=%2Flogin",
    );
    expect(guestReadingFontSizeHref("/guide")).toBe("/guide#guide-font-size");
    expect(guestReadingFontSizeHref("/guide/first/ready")).toBe(
      "/settings/reading-font-size?returnTo=%2Fguide%2Ffirst%2Fready",
    );
  });
});
