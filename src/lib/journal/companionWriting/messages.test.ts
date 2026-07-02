import { describe, expect, it } from "vitest";

import {
  assertCompanionWritingMessagesComplete,
  getCompanionFollowUpQuestion,
  getCompanionOpeningMessage,
} from "./messages";

describe("companionWriting messages", () => {
  it("全気分×鑑定士のことばテンプレが揃っている", () => {
    expect(() => assertCompanionWritingMessagesComplete()).not.toThrow();
  });

  it("気分とフィードバックに応じた一問を返す", () => {
    expect(getCompanionOpeningMessage("owl", "tired")).toMatch(/つかれた/);
    expect(getCompanionFollowUpQuestion("somewhat", "tired")).toMatch(/置いていきたい/);
  });
});
