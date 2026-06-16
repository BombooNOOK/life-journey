import { describe, expect, it } from "vitest";

import {
  normalizeReadingFontSize,
  readingFontSizeToDataAttribute,
} from "@/lib/reading/readingFontSize";

describe("readingFontSize", () => {
  it("maps xLarge to x-large data attribute", () => {
    expect(readingFontSizeToDataAttribute("xLarge")).toBe("x-large");
    expect(readingFontSizeToDataAttribute("normal")).toBe("normal");
  });

  it("normalizes unknown values to normal", () => {
    expect(normalizeReadingFontSize("x-large")).toBe("xLarge");
    expect(normalizeReadingFontSize("bogus")).toBe("normal");
  });
});
