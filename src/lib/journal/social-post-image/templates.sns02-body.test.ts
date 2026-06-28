import { describe, expect, it } from "vitest";

import { JOURNAL_SOCIAL_POST_TEMPLATES } from "./templates";

describe("sns02 body text block", () => {
  it("中央ブロック内で左揃え", () => {
    expect(JOURNAL_SOCIAL_POST_TEMPLATES.sns02.body).toMatchObject({
      x: 130,
      y: 640,
      textAnchor: "start",
      maxCharsPerLine: 24,
      maxLines: 2,
    });
  });
});
