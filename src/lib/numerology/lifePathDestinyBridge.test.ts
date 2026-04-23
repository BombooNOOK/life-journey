import { describe, expect, it } from "vitest";

import {
  bridgeAgreementPdfParts,
  bridgeStarsFromScorePercent,
  pairKeyFromLifePathAndDestiny,
  scoreLabelFromPercent,
} from "./lifePathDestinyBridge";

describe("pairKeyFromLifePathAndDestiny", () => {
  it("LP9 / D1 → 91", () => {
    expect(pairKeyFromLifePathAndDestiny(9, 1)).toBe("91");
  });

  it("LP2 / D1 → 21", () => {
    expect(pairKeyFromLifePathAndDestiny(2, 1)).toBe("21");
  });

  it("正規化後に同じ数字なら pairKey は 00", () => {
    expect(pairKeyFromLifePathAndDestiny(5, 5)).toBe("00");
  });

  it("マスター LP は 1 桁に縮約してから並べる", () => {
    expect(pairKeyFromLifePathAndDestiny(11, 1)).toBe("21");
  });
});

describe("scoreLabel / stars", () => {
  it("固定文言", () => {
    expect(scoreLabelFromPercent(100)).toBe("自然と同じ方向を向きやすい関係です");
    expect(scoreLabelFromPercent(20)).toBe("進み方にズレを感じやすい関係です");
  });

  it("星はパーセントごとに固定", () => {
    expect(bridgeStarsFromScorePercent(20)).toBe("★☆☆☆☆");
    expect(bridgeStarsFromScorePercent(100)).toBe("★★★★★");
  });

  it("登録外の値は最も近い段階に寄せる", () => {
    expect(bridgeStarsFromScorePercent(55)).toBe(bridgeStarsFromScorePercent(60));
  });

  it("bridgeAgreementPdfParts は Unicode・ASCII・段階数を返す", () => {
    const p = bridgeAgreementPdfParts(40);
    expect(p.percentShown).toBe(40);
    expect(p.filledOf5).toBe(2);
    expect(p.unicodeStars).toBe("★★☆☆☆");
    expect(p.asciiStars.length).toBe(5);
  });
});
