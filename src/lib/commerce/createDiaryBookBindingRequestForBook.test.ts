import { describe, expect, it } from "vitest";

import { getBookPlan } from "@/lib/order/bookBindingPlan";
import { countBoundDiaryBookTotalPages } from "@/lib/journal/diaryBookBindingOffer";
import { buildBoundDiaryBookPages } from "@/lib/journal/diaryBookPages";

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

describe("diary book binding page count for plan", () => {
  it("uses buildBoundDiaryBookPages length for plan tiers", () => {
    const pages = buildBoundDiaryBookPages([sampleEntry], "2025-10-01", "2025-10-31");
    const total = countBoundDiaryBookTotalPages([sampleEntry], "2025-10-01", "2025-10-31");
    expect(total).toBe(pages.length);
    expect(getBookPlan(total).orderable).toBe(true);
  });
});
