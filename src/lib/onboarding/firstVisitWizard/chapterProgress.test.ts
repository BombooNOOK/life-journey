import { describe, expect, it } from "vitest";

import {
  inferChapter1Complete,
  inferChapter2Complete,
  inferChapter3Complete,
  isFirstVisitPathGuideComplete,
  resolveFirstVisitChapterCards,
  type ChapterProgressInput,
} from "@/lib/onboarding/firstVisitWizard/chapterProgress";
import { FIRST_VISIT_CHAPTER_3_ENTRY_HREF } from "@/lib/onboarding/firstVisitWizard/chapters";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import { LOG_HOUSE_MAIN_ACTIONS_HREF } from "@/lib/journal/logHouseLabels";

const baseInput: ChapterProgressInput = {
  branch: "guest",
  journalEntryCount: 0,
  savedStage: null,
  chapter1CompleteFlag: false,
  chapter2CompleteFlag: false,
  chapter3CompleteFlag: false,
  chapter3StartedFlag: false,
  bookshelfKanteiGuide: false,
  orderGuide: false,
  fromRegisterHandoff: false,
};

describe("chapterProgress", () => {
  it("locks chapters 2 and 3 for guests at chapter 1", () => {
    const cards = resolveFirstVisitChapterCards(baseInput);
    expect(cards[0]?.status).toBe("available");
    expect(cards[1]?.status).toBe("locked");
    expect(cards[2]?.status).toBe("locked");
    expect(cards[0]?.buttonLabel).toBe("ここから進む");
    expect(cards[0]?.actionHref).toBe(FIRST_VISIT_ROUTES.register);
  });

  it("shows chapter 1 in progress for logged-in users without completion", () => {
    const cards = resolveFirstVisitChapterCards({
      ...baseInput,
      branch: "needsKantei",
    });
    expect(cards[0]?.status).toBe("in_progress");
    expect(cards[0]?.buttonLabel).toBe("続きから進む");
    expect(cards[0]?.actionHref).toBe(FIRST_VISIT_ROUTES.residentCard);
    expect(cards[1]?.status).toBe("locked");
  });

  it("resumes logged-in users with a resident card at loghouse complete (chapter 1 end)", () => {
    const cards = resolveFirstVisitChapterCards({
      ...baseInput,
      branch: "needsKantei",
      hasResidentCard: true,
    });
    expect(cards[0]?.status).toBe("in_progress");
    expect(cards[0]?.actionHref).toBe(FIRST_VISIT_ROUTES.kantei);
    expect(cards[1]?.status).toBe("locked");
  });

  it("does not send resident-card holders back to resident-card via fromRegister handoff", () => {
    const cards = resolveFirstVisitChapterCards({
      ...baseInput,
      branch: "needsKantei",
      fromRegisterHandoff: true,
      hasResidentCard: true,
    });
    expect(cards[0]?.actionHref).toBe(FIRST_VISIT_ROUTES.kantei);
  });

  it("unlocks chapter 2 when chapter 1 end stage is saved without entering chapter 2", () => {
    const cards = resolveFirstVisitChapterCards({
      ...baseInput,
      branch: "needsKantei",
      savedStage: "kantei",
    });
    expect(inferChapter1Complete({
      ...baseInput,
      branch: "needsKantei",
      savedStage: "kantei",
    })).toBe(true);
    expect(cards[0]?.status).toBe("complete");
    expect(cards[1]?.status).toBe("available");
  });

  it("unlocks chapter 2 after chapter 1 completes", () => {
    const cards = resolveFirstVisitChapterCards({
      ...baseInput,
      branch: "needsKantei",
      chapter1CompleteFlag: true,
    });
    expect(cards[0]?.status).toBe("complete");
    expect(cards[1]?.status).toBe("available");
    expect(cards[1]?.actionHref).toBe(FIRST_VISIT_ROUTES.kanteiReady);
    expect(cards[2]?.status).toBe("locked");
  });

  it("shows review buttons when all chapters are complete", () => {
    const cards = resolveFirstVisitChapterCards({
      ...baseInput,
      branch: "hasKantei",
      journalEntryCount: 1,
      chapter1CompleteFlag: true,
    });
    expect(isFirstVisitPathGuideComplete({
      ...baseInput,
      branch: "hasKantei",
      journalEntryCount: 1,
      chapter1CompleteFlag: true,
    })).toBe(true);
    expect(cards.every((c) => c.buttonLabel === "見返す")).toBe(true);
    expect(cards[0]?.actionHref).toBe("/help/ljd#loghouse");
    expect(cards[2]?.actionHref).toBe("/help/ljd#writing");
  });

  it("infers chapter completion from server state", () => {
    expect(
      inferChapter1Complete({ ...baseInput, branch: "hasKantei" }),
    ).toBe(true);
    expect(
      inferChapter2Complete({ ...baseInput, branch: "hasKantei" }),
    ).toBe(true);
    expect(
      inferChapter3Complete({ ...baseInput, journalEntryCount: 2 }),
    ).toBe(true);
  });

  it("resumes chapter 2 from bookshelf guide flag", () => {
    const cards = resolveFirstVisitChapterCards({
      ...baseInput,
      branch: "needsKantei",
      chapter1CompleteFlag: true,
      bookshelfKanteiGuide: true,
    });
    expect(cards[1]?.status).toBe("in_progress");
    expect(cards[1]?.actionHref).toBe("/orders/bookshelf#bookshelf-kantei-books");
  });

  it("routes chapter 3 through the loghouse sign page", () => {
    const cards = resolveFirstVisitChapterCards({
      ...baseInput,
      branch: "hasKantei",
      chapter1CompleteFlag: true,
    });
    expect(cards[2]?.status).toBe("available");
    expect(cards[2]?.actionHref).toBe(FIRST_VISIT_ROUTES.chapter3Sign);
  });

  it("lands chapter 3 diary entry on log house main actions", () => {
    expect(FIRST_VISIT_CHAPTER_3_ENTRY_HREF).toBe(LOG_HOUSE_MAIN_ACTIONS_HREF);
  });

  it("resumes chapter 3 on log house after the sign step started", () => {
    const cards = resolveFirstVisitChapterCards({
      ...baseInput,
      branch: "hasKantei",
      chapter1CompleteFlag: true,
      chapter3StartedFlag: true,
    });
    expect(cards[2]?.status).toBe("in_progress");
    expect(cards[2]?.actionHref).toBe(LOG_HOUSE_MAIN_ACTIONS_HREF);
  });
});
