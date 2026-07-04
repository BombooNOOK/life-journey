/** はじめての方へ（道案内ウィザード）のルート */
export const FIRST_VISIT_ROUTES = {
  welcome: "/guide/first/welcome",
  about: "/guide/first/about",
  owl: "/guide/first/owl",
  ready: "/guide/first/ready",
  loghouse: "/guide/first/loghouse",
  kantei: "/guide/first/kantei",
} as const;

export type FirstVisitRouteKey = keyof typeof FIRST_VISIT_ROUTES;
