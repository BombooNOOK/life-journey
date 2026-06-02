import { describe, expect, it } from "vitest";

import {
  countBoundDiaryBookTotalPages,
  diaryBookBindingOverviewValue,
  DIARY_BOOK_BINDING_CONSULTATION_MESSAGE,
} from "./diaryBookBindingOffer";
import { getBookPlan } from "@/lib/order/bookBindingPlan";

const sampleEntry = {
  id: "e1",
  content: "a",
  createdAt: "2025-10-15T03:00:00.000Z",
  mood: "calm",
  activity: "record_anyway",
  companionType: "owl",
  photoDataUrl: null,
  generatedComment: null,
} as const;

describe("countBoundDiaryBookTotalPages", () => {
  it("includes cover, month pages, and tail pages", () => {
    const total = countBoundDiaryBookTotalPages([sampleEntry], "2025-10-01", "2025-10-31");
    expect(total).toBeGreaterThan(1);
  });
});

describe("diaryBookBindingOverviewValue", () => {
  it("shows shelf-friendly plan label with page cap", () => {
    expect(diaryBookBindingOverviewValue(getBookPlan(80))).toBe("ライト版（100ページまで）");
    expect(diaryBookBindingOverviewValue(getBookPlan(50))).toBe("お試し製本版（50ページまで）");
  });

  it("shows consultation message when over limit", () => {
    expect(diaryBookBindingOverviewValue(getBookPlan(401))).toBe(
      DIARY_BOOK_BINDING_CONSULTATION_MESSAGE,
    );
  });
});
