import { describe, expect, it } from "vitest";

import { buildCanvaCopyText, buildInstagramCaption } from "./buildCopyText";
import { resolveDailyNumberPost } from "./resolveDailyNumberPost";

describe("resolveDailyNumberPost", () => {
  it("todayNumber=8 owl base で生成できる", () => {
    const result = resolveDailyNumberPost({
      scheduledDate: "2026-06-19",
      todayNumber: 8,
      character: "owl",
      messageType: "base",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.todayNumber).toBe(8);
    expect(result.payload.pages).toHaveLength(6);
    expect(result.payload.pages[0]?.blocks).toHaveLength(2);
    expect(result.canvaCopyText).toContain("【表紙】");
    expect(result.captionText).toContain("#BambooNOOK");
  });

  it("UD1〜9 owl base variant A は生成できる", () => {
    const result = resolveDailyNumberPost({
      scheduledDate: "2026-06-24",
      todayNumber: 4,
      character: "owl",
      messageType: "base",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.todayNumber).toBe(4);
    expect(result.payload.variantMode).toBe("A");
    expect(result.payload.variant).toBe("A");
    expect(result.payload.cover.variant).toBe("A");
    expect(result.payload.pages).toHaveLength(6);
  });

  it("variant B/C で表紙・個別が同じ variant になる", () => {
    for (const coverVariantMode of ["B", "C"] as const) {
      const result = resolveDailyNumberPost({
        scheduledDate: "2026-06-24",
        todayNumber: 3,
        character: "owl",
        messageType: "base",
        coverVariantMode,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.payload.variantMode).toBe(coverVariantMode);
      expect(result.payload.variant).toBe(coverVariantMode);
      expect(result.payload.cover.variant).toBe(coverVariantMode);
      for (const page of result.payload.pages) {
        for (const block of page.blocks) {
          expect(block.variant ?? coverVariantMode).toBe(coverVariantMode);
        }
      }
    }
  });

  it("ランダムは lockedVariant で表紙・個別を統一する", () => {
    const result = resolveDailyNumberPost({
      scheduledDate: "2026-06-24",
      todayNumber: 5,
      character: "owl",
      messageType: "base",
      coverVariantMode: "random",
      lockedVariant: "C",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.variantMode).toBe("random");
    expect(result.payload.variant).toBe("C");
    expect(result.payload.cover.variant).toBe("C");
  });

  it("ランダムは lockedClosingVariant でラストページを固定する", () => {
    const result = resolveDailyNumberPost({
      scheduledDate: "2026-06-24",
      todayNumber: 5,
      character: "owl",
      messageType: "base",
      coverVariantMode: "random",
      lockedVariant: "C",
      lockedClosingVariant: "animal_friends",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.closingVariant).toBe("animal_friends");
  });

  it("データ未整備のキャラは data_not_ready", () => {
    const result = resolveDailyNumberPost({
      scheduledDate: "2026-06-19",
      todayNumber: 8,
      character: "frog",
      messageType: "base",
    });
    expect(result.ok).toBe(false);
  });
});

describe("buildCopyText", () => {
  it("Canva用にすうじブロックを含む", () => {
    const resolved = resolveDailyNumberPost({
      scheduledDate: "2026-06-19",
      todayNumber: 8,
      character: "owl",
      messageType: "base",
    });
    if (!resolved.ok) throw new Error("expected ok");
    const text = buildCanvaCopyText(resolved.payload);
    expect(text).toContain("すうじ1のあなたへ");
    expect(text).toContain("おすすめのすごしかた");
    const caption = buildInstagramCaption(resolved.payload);
    expect(caption).toContain("今日のすうじは「8」");
  });
});
