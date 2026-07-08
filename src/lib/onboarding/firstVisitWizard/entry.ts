import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";

/** はじめての方導線の入口（森の案内図） */
export const FIRST_VISIT_ENTRY_HREF = FIRST_VISIT_ROUTES.welcome;

/** 旧フロー（/login → /order で生年月日入力）への returnTo か */
export function isLegacyStandaloneOrderRegisterReturnTo(returnTo: string | null | undefined): boolean {
  if (!returnTo) return false;
  return returnTo === "/order" || returnTo.startsWith("/order?");
}
