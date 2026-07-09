import type { FirstVisitChapterId } from "@/lib/onboarding/firstVisitWizard/chapters";
import {
  FIRST_VISIT_CHAPTER_3_ENTRY_HREF,
  FIRST_VISIT_CHAPTERS,
} from "@/lib/onboarding/firstVisitWizard/chapters";
import type { FirstVisitProgressStage } from "@/lib/onboarding/firstVisitWizard/progress";
import { firstVisitProgressHref } from "@/lib/onboarding/firstVisitWizard/progress";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import type { FirstVisitReadyBranch } from "@/lib/viewer/firstVisitReadyContext";

export type ChapterCardStatus = "locked" | "available" | "in_progress" | "complete";

export type ChapterCardViewModel = {
  id: FirstVisitChapterId;
  label: string;
  title: string;
  description: string;
  timeEstimate: string;
  status: ChapterCardStatus;
  statusLabel: string;
  actionHref: string | null;
  buttonLabel: string | null;
  reviewHref: string;
};

const CHAPTER_1_STAGES = [
  "register",
  "resident-card",
  "loghouse-sign",
  "loghouse",
  "kantei",
] as const satisfies readonly FirstVisitProgressStage[];

const CHAPTER_2_STAGES = [
  "kantei-ready",
  "order",
  "bookshelf-kantei",
] as const satisfies readonly FirstVisitProgressStage[];

export type ChapterProgressInput = {
  branch: FirstVisitReadyBranch;
  journalEntryCount: number;
  savedStage: FirstVisitProgressStage | null;
  chapter1CompleteFlag: boolean;
  chapter2CompleteFlag: boolean;
  chapter3CompleteFlag: boolean;
  chapter3StartedFlag: boolean;
  bookshelfKanteiGuide: boolean;
  orderGuide: boolean;
  fromRegisterHandoff: boolean;
};

function isLoggedIn(branch: FirstVisitReadyBranch): boolean {
  return branch !== "guest";
}

function hasKantei(branch: FirstVisitReadyBranch): boolean {
  return branch === "hasKantei";
}

export function inferChapter1Complete(input: ChapterProgressInput): boolean {
  if (input.chapter1CompleteFlag) return true;
  if (hasKantei(input.branch)) return true;
  if (input.savedStage === "kantei") return true;
  if (input.savedStage && (CHAPTER_2_STAGES as readonly string[]).includes(input.savedStage)) {
    return true;
  }
  return false;
}

export function inferChapter2Complete(input: ChapterProgressInput): boolean {
  if (input.chapter2CompleteFlag) return true;
  return hasKantei(input.branch);
}

export function inferChapter3Complete(input: ChapterProgressInput): boolean {
  if (input.chapter3CompleteFlag) return true;
  return input.journalEntryCount > 0;
}

export function isFirstVisitPathGuideComplete(input: ChapterProgressInput): boolean {
  return (
    inferChapter1Complete(input) &&
    inferChapter2Complete(input) &&
    inferChapter3Complete(input)
  );
}

function isChapter1InProgress(input: ChapterProgressInput, ch1Complete: boolean): boolean {
  if (ch1Complete) return false;
  if (input.fromRegisterHandoff) return true;
  if (input.savedStage && (CHAPTER_1_STAGES as readonly string[]).includes(input.savedStage)) {
    return true;
  }
  return isLoggedIn(input.branch);
}

function isChapter2InProgress(input: ChapterProgressInput, ch2Complete: boolean): boolean {
  if (ch2Complete) return false;
  if (input.bookshelfKanteiGuide || input.orderGuide) return true;
  if (input.savedStage && (CHAPTER_2_STAGES as readonly string[]).includes(input.savedStage)) {
    return true;
  }
  return false;
}

function isChapter3InProgress(input: ChapterProgressInput, ch3Complete: boolean): boolean {
  if (ch3Complete) return false;
  return input.chapter3StartedFlag;
}

function resolveChapter1ResumeHref(input: ChapterProgressInput): string {
  if (input.fromRegisterHandoff) return FIRST_VISIT_ROUTES.residentCard;
  if (input.savedStage === "register") return FIRST_VISIT_ROUTES.residentCard;
  if (input.savedStage && (CHAPTER_1_STAGES as readonly string[]).includes(input.savedStage)) {
    return firstVisitProgressHref(input.savedStage);
  }
  if (isLoggedIn(input.branch)) return FIRST_VISIT_ROUTES.residentCard;
  return FIRST_VISIT_ROUTES.register;
}

function resolveChapter2ResumeHref(input: ChapterProgressInput): string {
  if (input.bookshelfKanteiGuide) {
    return firstVisitProgressHref("bookshelf-kantei");
  }
  if (input.orderGuide || input.savedStage === "order") {
    return firstVisitProgressHref("order");
  }
  if (input.savedStage === "bookshelf-kantei") {
    return firstVisitProgressHref("bookshelf-kantei");
  }
  return FIRST_VISIT_ROUTES.kanteiReady;
}

function resolveChapterStatus(
  chapterId: FirstVisitChapterId,
  input: ChapterProgressInput,
  ch1Complete: boolean,
  ch2Complete: boolean,
  ch3Complete: boolean,
): ChapterCardStatus {
  if (chapterId === 1) {
    if (ch1Complete) return "complete";
    if (isChapter1InProgress(input, ch1Complete)) return "in_progress";
    return "available";
  }

  if (chapterId === 2) {
    if (!ch1Complete) return "locked";
    if (ch2Complete) return "complete";
    if (isChapter2InProgress(input, ch2Complete)) return "in_progress";
    return "available";
  }

  if (!ch2Complete) return "locked";
  if (ch3Complete) return "complete";
  if (isChapter3InProgress(input, ch3Complete)) return "in_progress";
  return "available";
}

function resolveChapterAction(
  chapterId: FirstVisitChapterId,
  status: ChapterCardStatus,
  input: ChapterProgressInput,
  allComplete: boolean,
): { actionHref: string | null; buttonLabel: string | null; statusLabel: string } {
  const chapter = FIRST_VISIT_CHAPTERS.find((c) => c.id === chapterId);
  const reviewHref = chapter?.reviewHref ?? FIRST_VISIT_ROUTES.pathGuide;

  if (status === "locked") {
    return { actionHref: null, buttonLabel: null, statusLabel: "前の章が終わると進めます" };
  }

  if (status === "complete") {
    if (allComplete) {
      return { actionHref: reviewHref, buttonLabel: "見返す", statusLabel: "完了しました" };
    }
    return { actionHref: null, buttonLabel: null, statusLabel: "完了しました" };
  }

  if (status === "in_progress") {
    const href =
      chapterId === 1
        ? resolveChapter1ResumeHref(input)
        : chapterId === 2
          ? resolveChapter2ResumeHref(input)
          : FIRST_VISIT_CHAPTER_3_ENTRY_HREF;
    return { actionHref: href, buttonLabel: "続きから進む", statusLabel: "続きから進む" };
  }

  const href =
    chapterId === 1
      ? FIRST_VISIT_ROUTES.register
      : chapterId === 2
        ? FIRST_VISIT_ROUTES.kanteiReady
        : FIRST_VISIT_CHAPTER_3_ENTRY_HREF;
  return { actionHref: href, buttonLabel: "ここから進む", statusLabel: "ここから進む" };
}

export function resolveFirstVisitChapterCards(input: ChapterProgressInput): ChapterCardViewModel[] {
  const ch1Complete = inferChapter1Complete(input);
  const ch2Complete = inferChapter2Complete(input);
  const ch3Complete = inferChapter3Complete(input);
  const allComplete = ch1Complete && ch2Complete && ch3Complete;

  return FIRST_VISIT_CHAPTERS.map((chapter) => {
    const status = resolveChapterStatus(chapter.id, input, ch1Complete, ch2Complete, ch3Complete);
    const action = resolveChapterAction(chapter.id, status, input, allComplete);

    return {
      id: chapter.id,
      label: chapter.label,
      title: chapter.title,
      description: chapter.description,
      timeEstimate: chapter.timeEstimate,
      status,
      statusLabel: action.statusLabel,
      actionHref: action.actionHref,
      buttonLabel: action.buttonLabel,
      reviewHref: chapter.reviewHref,
    };
  });
}
