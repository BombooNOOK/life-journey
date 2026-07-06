export { resolveSafeReturnTo } from "@/lib/navigation/safeReturnTo";

export type LoginFlowIntent = "login" | "register";

/** はじめての方（無料鑑定）か、既存会員のログインか */
export function resolveLoginFlow(
  returnTo: string,
  flowIntent?: LoginFlowIntent | null,
): LoginFlowIntent {
  if (flowIntent === "register") return "register";
  if (flowIntent === "login") return "login";
  if (returnTo === "/order" || returnTo.startsWith("/order/")) return "register";
  if (
    returnTo === "/guide/first/loghouse" ||
    returnTo.startsWith("/guide/first/loghouse?") ||
    returnTo === "/guide/first/resident-card" ||
    returnTo.startsWith("/guide/first/resident-card?")
  ) {
    return "register";
  }
  return "login";
}

export function buildLoginHref(returnTo: string, flowIntent?: LoginFlowIntent): string {
  const params = new URLSearchParams();
  params.set("returnTo", returnTo);
  if (flowIntent) params.set("flow", flowIntent);
  return `/login?${params.toString()}`;
}

export function isFirstVisitLoghouseReturnTo(returnTo: string): boolean {
  return (
    returnTo === "/guide/first/loghouse" ||
    returnTo.startsWith("/guide/first/loghouse?") ||
    returnTo === "/guide/first/resident-card" ||
    returnTo.startsWith("/guide/first/resident-card?")
  );
}

import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";

/** 初回登録完了後の最初の行き先 */
export function firstVisitPostRegisterDestination(): string {
  return FIRST_VISIT_ROUTES.residentCard;
}
