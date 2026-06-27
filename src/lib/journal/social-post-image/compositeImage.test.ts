import { describe, expect, it } from "vitest";

import {
  buildJournalSocialPostImageInput,
  compositeJournalSocialPostImage,
} from "./compositeImage";
import { JOURNAL_SOCIAL_POST_IMAGE_SIZE } from "./types";

describe("compositeJournalSocialPostImage", () => {
  it("sns02 テンプレで 1080×1350 の PNG を生成する", async () => {
    const createdAt = new Date("2026-06-19T00:00:00.000Z");
    const input = buildJournalSocialPostImageInput({
      templateId: "sns02",
      title: "イスの下からこんにちは",
      bodyExcerpt: "今日はモグの病院最終日。",
      todayNumber: 4,
      monthNumber: 3,
      yearNumber: 6,
      moodLabel: "移動・おでかけをした",
      commentExcerpt: "動いたことが、やさしく次の流れにつながる日。",
      photoBuffer: null,
      companionType: "owl",
      createdAt,
    });

    const { buffer, basename } = await compositeJournalSocialPostImage(input, { createdAt });
    expect(buffer.byteLength).toBeGreaterThan(50_000);
    expect(basename).toBe("20260619_diary-sns_sns02");

    const sharp = (await import("sharp")).default;
    const meta = await sharp(buffer).metadata();
    expect(meta.width).toBe(JOURNAL_SOCIAL_POST_IMAGE_SIZE.widthPx);
    expect(meta.height).toBe(JOURNAL_SOCIAL_POST_IMAGE_SIZE.heightPx);
  });

  it("sns03 テンプレで PNG を生成する", async () => {
    const createdAt = new Date("2026-06-19T00:00:00.000Z");
    const input = buildJournalSocialPostImageInput({
      templateId: "sns03",
      title: "イスの下からこんにちは",
      bodyExcerpt: "今日はモグの病院最終日。",
      todayNumber: 4,
      monthNumber: 3,
      yearNumber: 6,
      moodLabel: "移動・おでかけ",
      commentExcerpt: "静かな一日も、心を整える大切なひとコマです。",
      photoBuffer: null,
      companionType: "owl",
      createdAt,
    });

    const { buffer } = await compositeJournalSocialPostImage(input, { createdAt });
    expect(buffer.byteLength).toBeGreaterThan(50_000);
  });

  it("sns02 でケロシオン選択時にキャラ別 base を合成する", async () => {
    const createdAt = new Date("2026-06-19T00:00:00.000Z");
    const input = buildJournalSocialPostImageInput({
      templateId: "sns02",
      title: "テスト",
      bodyExcerpt: "本文",
      todayNumber: 4,
      monthNumber: 3,
      yearNumber: 6,
      moodLabel: "ふつう",
      commentExcerpt: "ケロシオンのひとこと",
      photoBuffer: null,
      companionType: "frog",
      createdAt,
    });

    const { buffer } = await compositeJournalSocialPostImage(input, { createdAt });
    expect(buffer.byteLength).toBeGreaterThan(50_000);
  });
});
