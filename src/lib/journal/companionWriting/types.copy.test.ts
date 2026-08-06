import { describe, expect, it } from "vitest";

import {
  companionWritingForestDeliveryArrivedText,
  companionWritingQuestionsHeading,
  companionWritingSaveLoadingLabel,
} from "./types";

describe("companionWriting dynamic copy", () => {
  it("questions heading uses companion name", () => {
    expect(companionWritingQuestionsHeading("ハリネズミくん")).toBe(
      "ハリネズミくんからの質問に答えてみてください",
    );
  });

  it("save loading and arrived text use companion name", () => {
    expect(companionWritingSaveLoadingLabel("ナマケモノくん")).toBe(
      "ナマケモノくんがあしあとを確認しています…",
    );
    expect(companionWritingForestDeliveryArrivedText("リスくん")).toBe(
      "今日の1ページ、受け取りましたよ\nリスくんより",
    );
  });
});
