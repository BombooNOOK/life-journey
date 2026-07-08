import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";

/** スワイプ戻りを許可する初回導線（戻る UI がなく、戻っても不具合がない箇所） */
const SWIPE_BACK_ALLOWED_PATHS = new Set<string>([
  FIRST_VISIT_ROUTES.welcome,
  FIRST_VISIT_ROUTES.about,
]);

export function isFirstVisitSwipeBackAllowed(pathname: string): boolean {
  return SWIPE_BACK_ALLOWED_PATHS.has(pathname);
}

export function shouldBlockFirstVisitSwipeBack(pathname: string): boolean {
  if (!pathname.startsWith("/guide/first/")) return false;
  return !isFirstVisitSwipeBackAllowed(pathname);
}
