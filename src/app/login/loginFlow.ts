export function resolveSafeReturnTo(raw: string | null): string {
  if (!raw) return "/orders";
  if (!raw.startsWith("/")) return "/orders";
  if (raw.startsWith("//")) return "/orders";
  return raw;
}

/** はじめての方（無料鑑定）か、既存会員のログインか */
export function resolveLoginFlow(returnTo: string): "register" | "login" {
  if (returnTo === "/order" || returnTo.startsWith("/order/")) return "register";
  return "login";
}

export function buildLoginHref(returnTo: string): string {
  return `/login?returnTo=${encodeURIComponent(returnTo)}`;
}
