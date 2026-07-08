import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import {
  firstVisitProgressHref,
  type FirstVisitProgressStage,
} from "@/lib/onboarding/firstVisitWizard/progress";
import type { FirstVisitReadyBranch } from "@/lib/viewer/firstVisitReadyContext";

type ResumeInput = {
  branch: FirstVisitReadyBranch;
  savedStage: FirstVisitProgressStage | null;
  bookshelfKanteiGuide: boolean;
  orderGuide: boolean;
  fromRegisterHandoff: boolean;
};

const CHAPTER_1_RESUME_STAGES = [
  "register",
  "resident-card",
  "loghouse-sign",
  "loghouse",
  "kantei",
] as const satisfies readonly FirstVisitProgressStage[];

/** ログイン済みユーザーが初回導線に戻ったときの着地先 */
export function resolveFirstVisitResumeHref({
  branch,
  savedStage,
  bookshelfKanteiGuide,
  orderGuide,
  fromRegisterHandoff,
}: ResumeInput): string {
  if (bookshelfKanteiGuide) {
    return firstVisitProgressHref("bookshelf-kantei");
  }

  if (orderGuide) {
    return FIRST_VISIT_ROUTES.kanteiReady;
  }

  if (fromRegisterHandoff && branch === "needsKantei") {
    return FIRST_VISIT_ROUTES.residentCard;
  }

  if (branch === "guest") {
    if (
      savedStage &&
      (CHAPTER_1_RESUME_STAGES as readonly string[]).includes(savedStage)
    ) {
      if (savedStage === "register") return FIRST_VISIT_ROUTES.register;
      return firstVisitProgressHref(savedStage);
    }
    return FIRST_VISIT_ROUTES.pathGuide;
  }

  if (savedStage) {
    if (savedStage === "register") return FIRST_VISIT_ROUTES.residentCard;
    if (savedStage === "order") return FIRST_VISIT_ROUTES.kanteiReady;
    return firstVisitProgressHref(savedStage);
  }

  return FIRST_VISIT_ROUTES.pathGuide;
}
