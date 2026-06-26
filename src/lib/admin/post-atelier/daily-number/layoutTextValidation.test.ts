import { describe, expect, it } from "vitest";

import { DAILY_NUMBER_MESSAGES } from "./dailyNumberMessages";
import {
  assertDailyNumberMessageLayoutsValid,
  personalBodyBlockIndexForLifePath,
  validatePersonalBodyText,
} from "./layoutTextValidation";
import { wrapTextWithLineRules } from "./svgText";
import { DAILY_NUMBER_PERSONAL_BLOCK_LAYOUTS } from "./imageLayout";

describe("layoutTextValidation", () => {
  it("LP1 は上段・LP2 は下段のレイアウトになる", () => {
    expect(personalBodyBlockIndexForLifePath(1)).toBe(0);
    expect(personalBodyBlockIndexForLifePath(2)).toBe(1);
    expect(personalBodyBlockIndexForLifePath(22)).toBe(0);
    expect(personalBodyBlockIndexForLifePath(33)).toBe(1);
  });

  it("上段は81文字で切れる", () => {
    const top = DAILY_NUMBER_PERSONAL_BLOCK_LAYOUTS[0]!.body;
    const text = "あ".repeat(81);
    const issue = validatePersonalBodyText(text, 0);
    expect(issue).not.toBeNull();
    expect(issue?.shown).toBe(80);
  });

  it("下段は86文字で切れる", () => {
    const bottom = DAILY_NUMBER_PERSONAL_BLOCK_LAYOUTS[1]!.body;
    const text = "あ".repeat(86);
    const lines = wrapTextWithLineRules(
      text,
      bottom.lineRules,
      bottom.maxLines,
      bottom.continuationLineRule,
    );
    const shown = lines.reduce((sum, line) => sum + line.text.length, 0);
    expect(shown).toBeLessThan(86);
  });

  it("生成済み324件の本文・すごしかたはすべてレイアウトに収まる", () => {
    assertDailyNumberMessageLayoutsValid(
      DAILY_NUMBER_MESSAGES.map((m) => ({
        todayNumber: m.todayNumber,
        lifePathNumber: m.lifePathNumber,
        variant: m.variant ?? "A",
        body: m.body,
        action1: m.actions[0],
        action2: m.actions[1],
      })),
      { onlyFilled: true },
    );
  });
});
