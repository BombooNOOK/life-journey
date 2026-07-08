/** はじめての方へ（道案内ウィザード）のルート */
export const FIRST_VISIT_ROUTES = {
  pathGuide: "/guide/first/path-guide",
  welcome: "/guide/first/welcome",
  about: "/guide/first/about",
  owl: "/guide/first/owl",
  roadmap: "/guide/first/roadmap",
  guideStationSign: "/guide/first/guide-station-sign",
  guideStation: "/guide/first/guide-station",
  ready: "/guide/first/ready",
  register: "/guide/first/register",
  residentCard: "/guide/first/resident-card",
  loghouseSign: "/guide/first/loghouse-sign",
  kanteiReady: "/guide/first/kantei-ready",
  alreadyReady: "/guide/first/already-ready",
  loghouse: "/guide/first/loghouse",
  kantei: "/guide/first/kantei",
} as const;

export type FirstVisitRouteKey = keyof typeof FIRST_VISIT_ROUTES;

/** ヘッダー・フッターなしの全画面表示（動画・玄関など） */
export const FIRST_VISIT_FULL_BLEED_PATHS = [
  FIRST_VISIT_ROUTES.welcome,
  FIRST_VISIT_ROUTES.about,
  FIRST_VISIT_ROUTES.loghouse,
  FIRST_VISIT_ROUTES.kantei,
] as const;

export function isFirstVisitFullBleedPath(pathname: string): boolean {
  return pathname.startsWith("/guide/first/");
}
