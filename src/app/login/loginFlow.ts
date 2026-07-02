export { resolveSafeReturnTo } from "@/lib/navigation/safeReturnTo";

/** はじめての方（無料鑑定）か、既存会員のログインか */
export function resolveLoginFlow(returnTo: string): "register" | "login" {
  if (returnTo === "/order" || returnTo.startsWith("/order/")) return "register";
  return "login";
}

export function buildLoginHref(returnTo: string): string {
  return `/login?returnTo=${encodeURIComponent(returnTo)}`;
}
