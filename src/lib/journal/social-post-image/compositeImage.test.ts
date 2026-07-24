import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

import {
  buildJournalSocialPostImageInput,
  compositeJournalSocialPostImage,
} from "./compositeImage";
import { DEFAULT_JOURNAL_SOCIAL_POST_SUBTITLE } from "./textExtract";
import { JOURNAL_SOCIAL_POST_IMAGE_SIZE } from "./types";

describe("compositeJournalSocialPostImage", () => {
  it("sns02 テンプレで 1080×1350 の PNG を生成する", async () => {
    const createdAt = new Date("2026-06-19T00:00:00.000Z");
    const input = buildJournalSocialPostImageInput({
      templateId: "sns02",
      title: "イスの下からこんにちは",
      subtitle: "なんでもない今日の、かわいい記録",
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
      subtitle: "なんでもない今日の、かわいい記録",
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

  it("sns03 でハリネズミ選択時にキャラ別 base を合成する", async () => {
    const createdAt = new Date("2026-06-19T00:00:00.000Z");
    const input = buildJournalSocialPostImageInput({
      templateId: "sns03",
      title: "テスト",
      subtitle: DEFAULT_JOURNAL_SOCIAL_POST_SUBTITLE,
      bodyExcerpt: "本文",
      todayNumber: 4,
      monthNumber: 3,
      yearNumber: 6,
      moodLabel: "ふつう",
      commentExcerpt: "ハリネズミくんのひとこと",
      photoBuffer: null,
      companionType: "hedgehog",
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
      subtitle: DEFAULT_JOURNAL_SOCIAL_POST_SUBTITLE,
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

  it("sns02 で写真付きでも PNG を生成する", async () => {
    const demoPhotoPath = path.join(
      process.cwd(),
      "public/images/home-mock/demo-journal-photo.png",
    );
    const photoBuffer = fs.existsSync(demoPhotoPath) ? fs.readFileSync(demoPhotoPath) : null;
    expect(photoBuffer).not.toBeNull();

    const createdAt = new Date("2026-06-19T00:00:00.000Z");
    const input = buildJournalSocialPostImageInput({
      templateId: "sns02",
      title: "イスの下からこんにちは",
      subtitle: DEFAULT_JOURNAL_SOCIAL_POST_SUBTITLE,
      bodyExcerpt: "今日はモグの病院最終日。",
      todayNumber: 4,
      monthNumber: 3,
      yearNumber: 6,
      moodLabel: "移動・おでかけをした",
      commentExcerpt: "動いたことが、やさしく次の流れにつながる日。",
      photoBuffer,
      companionType: "owl",
      createdAt,
    });

    const { buffer } = await compositeJournalSocialPostImage(input, { createdAt });
    expect(buffer.byteLength).toBeGreaterThan(50_000);
  });
});

describe("mori ashiato templates", () => {
  it("chiisana_ashiato (full) composites to 1080×1350", async () => {
    const { buffer, basename } = await compositeJournalSocialPostImage(
      buildJournalSocialPostImageInput({
        templateId: "chiisana_ashiato",
        title: "ちいさな一日",
        bodyExcerpt: "公園で遊んだ。",
        subtitle: "",
        todayNumber: 25,
        monthNumber: 7,
        yearNumber: 6,
        moodLabel: "",
        commentExcerpt: "楽しかった",
        photoBuffer: null,
        companionType: "drfukuro",
        createdAt: new Date("2026-07-25T03:00:00.000Z"),
      }),
    );
    const meta = await sharp(buffer).metadata();
    expect(meta.width).toBe(1080);
    expect(meta.height).toBe(1350);
    expect(basename).toContain("chiisana_ashiato");
  });

  it("kyou_no_ashiato_wide composites to 1080×1920", async () => {
    const { buffer } = await compositeJournalSocialPostImage(
      buildJournalSocialPostImageInput({
        templateId: "kyou_no_ashiato_wide",
        title: "",
        bodyExcerpt: "",
        subtitle: "",
        todayNumber: null,
        monthNumber: null,
        yearNumber: null,
        moodLabel: "",
        commentExcerpt: "今日のひとこと",
        photoBuffer: null,
        companionType: "drfukuro",
        createdAt: new Date("2026-07-25T03:00:00.000Z"),
      }),
    );
    const meta = await sharp(buffer).metadata();
    expect(meta.width).toBe(1080);
    expect(meta.height).toBe(1920);
  });

  it("kyou_no_3koma_ashiato accepts photo in three slots", async () => {
    const photoBuffer = await sharp({
      create: { width: 400, height: 400, channels: 3, background: "#88aa66" },
    })
      .png()
      .toBuffer();
    const { buffer } = await compositeJournalSocialPostImage(
      buildJournalSocialPostImageInput({
        templateId: "kyou_no_3koma_ashiato",
        title: "",
        bodyExcerpt: "",
        subtitle: "",
        todayNumber: null,
        monthNumber: null,
        yearNumber: null,
        moodLabel: "",
        commentExcerpt: "朝・昼・夜",
        photoBuffer,
        companionType: "drfukuro",
        createdAt: new Date("2026-07-25T03:00:00.000Z"),
      }),
    );
    const meta = await sharp(buffer).metadata();
    expect(meta.width).toBe(1080);
    expect(meta.height).toBe(1920);
  });
});
