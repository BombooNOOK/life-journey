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

  it("falls back to about hash for other pages", () => {
    expect(guestReadingFontSizeHref("/login")).toBe("/about#about-font-size");
    expect(guestReadingFontSizeHref("/guide")).toBe("/guide#guide-font-size");
  });
});
