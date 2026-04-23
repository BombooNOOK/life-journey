import { describe, expect, it } from "vitest";

import { buildBridgeNumbersFromCore } from "./compute";
import { buildPdfBridgeBlocks } from "./pdfBridgeBlocks";
import type { NumerologyResult } from "./types";

function baseNumerology(over: Partial<NumerologyResult> = {}): NumerologyResult {
  const core = {
    lifePathNumber: 5,
    destinyNumber: 3 as number | null,
    soulNumber: 2 as number | null,
    personalityNumber: 4 as number | null,
    birthdayNumber: 7,
    ...over,
  };
  return {
    lifePathNumber: core.lifePathNumber,
    destinyNumber: core.destinyNumber,
    soulNumber: core.soulNumber,
    personalityNumber: core.personalityNumber,
    birthdayNumber: core.birthdayNumber,
    bridges: buildBridgeNumbersFromCore({
      lifePath: core.lifePathNumber,
      destiny: core.destinyNumber,
      soul: core.soulNumber,
      personality: core.personalityNumber,
      birthday: core.birthdayNumber,
    }),
  };
}

const TEN_IDS = [
  "lifePathDestiny",
  "lifePathSoul",
  "lifePathPersonality",
  "lifePathBirthday",
  "destinySoul",
  "destinyPersonality",
  "destinyBirthday",
  "soulPersonality",
  "soulBirthday",
  "personalityBirthday",
] as const;

describe("buildPdfBridgeBlocks", () => {
  it("ブリッジ 10 ペア分のブロックを固定順で返す", () => {
    const blocks = buildPdfBridgeBlocks(baseNumerology());
    expect(blocks.map((b) => b.id)).toEqual([...TEN_IDS]);
  });

  it("D・S・P が無いときは該当ブリッジは null でも 10 セクションは並ぶ", () => {
    const blocks = buildPdfBridgeBlocks(
      baseNumerology({
        destinyNumber: null,
        soulNumber: null,
        personalityNumber: null,
      }),
    );
    expect(blocks.map((b) => b.id)).toEqual([...TEN_IDS]);
    expect(blocks.find((b) => b.id === "lifePathDestiny")?.bridgeNumber).toBeNull();
    expect(blocks.find((b) => b.id === "lifePathBirthday")?.bridgeNumber).not.toBeNull();
  });

  it("コアが揃うと 10 ブロックすべて bridgeProfiles の本文・一致度が付く", () => {
    const blocks = buildPdfBridgeBlocks(baseNumerology());
    for (const b of blocks) {
      expect(b.article != null && b.article.length > 0).toBe(true);
      expect(b.scorePercent).not.toBeNull();
      expect(b.scoreLabel != null && b.scoreLabel.length > 0).toBe(true);
    }
  });

  it("pairKey が同じならペアの種類が違っても同一本文", () => {
    const blocks = buildPdfBridgeBlocks(
      baseNumerology({ destinyNumber: 3, soulNumber: 3 }),
    );
    const lpD = blocks.find((x) => x.id === "lifePathDestiny");
    const lpS = blocks.find((x) => x.id === "lifePathSoul");
    expect(lpD?.article).toBe(lpS?.article);
  });
});
