import { describe, expect, it } from "vitest";

import {
  JOURNAL_SOCIAL_POST_TEMPLATES,
  resolveJournalSocialPostPhotoRenderSize,
} from "./templates";

describe("sns03 photo template", () => {
  it("本番 rotateDeg は -5.2", () => {
    expect(JOURNAL_SOCIAL_POST_TEMPLATES.sns03.photo.rotateDeg).toBe(-5.2);
  });

  it("displayScale 1.01 で 400px スロットを 404px に描画", () => {
    expect(resolveJournalSocialPostPhotoRenderSize(JOURNAL_SOCIAL_POST_TEMPLATES.sns03.photo)).toEqual({
      width: 404,
      height: 404,
    });
  });

  it("日付は middle 基準で +4°", () => {
    expect(JOURNAL_SOCIAL_POST_TEMPLATES.sns03.dateScrapbook).toMatchObject({
      textAnchor: "middle",
      rotateDeg: 4,
    });
  });
});
