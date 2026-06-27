import { describe, expect, it } from "vitest";

import { compositeJournalSocialPostImage } from "./compositeImage";
import { JOURNAL_SOCIAL_POST_IMAGE_SIZE } from "./assetPaths";

describe("compositeJournalSocialPostImage", () => {
  it("1080×1350 の PNG を生成する", async () => {
    const { buffer, basename } = await compositeJournalSocialPostImage(
      {
        title: "おだやかな午後",
        dateLabel: "2026年6月27日",
        bodyExcerpt: "今日は部屋の掃除をしました。",
        todayNumber: 8,
        moodLabel: "おだやか",
        commentExcerpt: "静かな時間も、心を整える大切なひとコマです。",
        companionLabel: "フクロウ先生",
        photoBuffer: null,
      },
      { createdAt: new Date("2026-06-27T00:00:00.000Z") },
    );

    expect(buffer.byteLength).toBeGreaterThan(5_000);
    expect(buffer.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(basename).toBe("20260627_diary-sns");

    const sharp = (await import("sharp")).default;
    const meta = await sharp(buffer).metadata();
    expect(meta.width).toBe(JOURNAL_SOCIAL_POST_IMAGE_SIZE.widthPx);
    expect(meta.height).toBe(JOURNAL_SOCIAL_POST_IMAGE_SIZE.heightPx);
  });
});
