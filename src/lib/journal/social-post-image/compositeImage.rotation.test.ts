import fs from "node:fs";
import { describe, expect, it } from "vitest";
import sharp from "sharp";

import {
  buildJournalSocialPostImageInput,
  compositeJournalSocialPostImage,
} from "./compositeImage";
import {
  extractSocialPostBodyText,
  extractSocialPostCommentText,
  resolveJournalSocialPostSubtitle,
} from "./textExtract";

describe("compositeJournalSocialPostImage rotation diff", () => {
  it(
    "±10° は 0° とも互いに異なる見た目になる",
    async () => {
      const photoPath = "public/images/home-mock/demo-journal-photo.png";
      if (!fs.existsSync(photoPath)) return;

      const photoBuffer = fs.readFileSync(photoPath);
      const createdAt = new Date("2026-06-19T00:00:00.000Z");
      const input = buildJournalSocialPostImageInput({
        templateId: "sns03",
        title: "test",
        bodyExcerpt: extractSocialPostBodyText("今日はモグの病院最終日。"),
        subtitle: resolveJournalSocialPostSubtitle(null),
        todayNumber: 4,
        monthNumber: 3,
        yearNumber: 6,
        moodLabel: "移動",
        commentExcerpt: extractSocialPostCommentText("コメント"),
        photoBuffer,
        companionType: "owl",
        createdAt,
      });

      const zero = (await compositeJournalSocialPostImage(input, { createdAt, photoRotateDeg: 0 }))
        .buffer;
      const plus = (await compositeJournalSocialPostImage(input, { createdAt, photoRotateDeg: 10 }))
        .buffer;
      const minus = (await compositeJournalSocialPostImage(input, { createdAt, photoRotateDeg: -10 }))
        .buffer;

    async function diffPixels(a: Buffer, b: Buffer) {
      const { data: da } = await sharp(a).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const { data: db } = await sharp(b).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      let diff = 0;
      for (let i = 0; i < da.length; i += 4) {
        const d =
          Math.abs(da[i]! - db[i]!) +
          Math.abs(da[i + 1]! - db[i + 1]!) +
          Math.abs(da[i + 2]! - db[i + 2]!);
        if (d > 0) diff += 1;
      }
      return diff;
    }

    const diff0Plus = await diffPixels(zero, plus);
    const diff0Minus = await diffPixels(zero, minus);
    const diffPlusMinus = await diffPixels(plus, minus);

    expect(diff0Plus).toBeGreaterThan(1000);
    expect(diff0Minus).toBeGreaterThan(1000);
    expect(diffPlusMinus).toBeGreaterThan(1000);
    },
    30_000,
  );
});
