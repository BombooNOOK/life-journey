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

function safeResumeHref(stage: FirstVisitProgressStage): string {
  if (stage === "register") return FIRST_VISIT_ROUTES.residentCard;
  if (stage === "order") return FIRST_VISIT_ROUTES.kanteiReady;
  return firstVisitProgressHref(stage);
}

/** ログイン済みユーザーが初回導線に戻ったときの着地先 */
export function resolveFirstVisitResumeHref({
  branch,
  savedStage,
  bookshelfKanteiGuide,
  orderGuide,
  fromRegisterHandoff,
}: ResumeInput): string {
  if (branch === "guest") return FIRST_VISIT_ROUTES.welcome;

  if (bookshelfKanteiGuide) {
    return firstVisitProgressHref("bookshelf-kantei");
  }

  if (orderGuide) {
    return FIRST_VISIT_ROUTES.kanteiReady;
  }

  if (fromRegisterHandoff && branch === "needsKantei") {
    return FIRST_VISIT_ROUTES.residentCard;
  }

  if (savedStage) {
    return safeResumeHref(savedStage);
  }

  if (branch === "hasKantei") {
    return "/orders/bookshelf";
  }

  if (branch === "needsKantei") {
    return FIRST_VISIT_ROUTES.kanteiReady;
  }

  return FIRST_VISIT_ROUTES.welcome;
}
