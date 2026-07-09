import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";

/** 初回導線の再開用チェックポイント */
export type FirstVisitProgressStage =
  | "path-guide"
  | "welcome"
  | "about"
  | "owl"
  | "roadmap"
  | "guide-station-sign"
  | "guide-station"
  | "register"
  | "resident-card"
  | "loghouse-sign"
  | "loghouse"
  | "kantei"
  | "kantei-ready"
  | "order"
  | "bookshelf-kantei"
  | "chapter-3-sign";

const PROGRESS_FLAG = "ljd:firstGuide:progress";

const STAGE_ROUTES: Record<FirstVisitProgressStage, string> = {
  "path-guide": FIRST_VISIT_ROUTES.pathGuide,
  welcome: FIRST_VISIT_ROUTES.welcome,
  about: FIRST_VISIT_ROUTES.about,
  owl: FIRST_VISIT_ROUTES.owl,
  roadmap: FIRST_VISIT_ROUTES.roadmap,
  "guide-station-sign": FIRST_VISIT_ROUTES.guideStationSign,
  "guide-station": FIRST_VISIT_ROUTES.guideStation,
  register: FIRST_VISIT_ROUTES.register,
  "resident-card": FIRST_VISIT_ROUTES.residentCard,
  "loghouse-sign": FIRST_VISIT_ROUTES.loghouseSign,
  loghouse: FIRST_VISIT_ROUTES.loghouse,
  kantei: FIRST_VISIT_ROUTES.kantei,
  "kantei-ready": FIRST_VISIT_ROUTES.kanteiReady,
  order: "/order",
  "bookshelf-kantei": "/orders/bookshelf#bookshelf-kantei-books",
  "chapter-3-sign": FIRST_VISIT_ROUTES.chapter3Sign,
};

function canUseSessionStorage(): boolean {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function firstVisitProgressHref(stage: FirstVisitProgressStage): string {
  return STAGE_ROUTES[stage];
}

export function readFirstVisitProgressStage(): FirstVisitProgressStage | null {
  if (!canUseSessionStorage()) return null;
  const raw = window.sessionStorage.getItem(PROGRESS_FLAG);
  if (!raw) return null;
  if (raw in STAGE_ROUTES) return raw as FirstVisitProgressStage;
  return null;
}

export function setFirstVisitProgressStage(stage: FirstVisitProgressStage): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(PROGRESS_FLAG, stage);
}

export function clearFirstVisitProgressStage(): void {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(PROGRESS_FLAG);
}

export function pathnameToFirstVisitProgressStage(pathname: string): FirstVisitProgressStage | null {
  if (pathname === "/order") return "order";
  if (pathname.startsWith("/orders/bookshelf")) return "bookshelf-kantei";

  const entry = Object.entries(STAGE_ROUTES).find(([, href]) => {
    const pathOnly = href.split("#")[0] ?? href;
    return pathOnly === pathname;
  });
  return entry ? (entry[0] as FirstVisitProgressStage) : null;
}

export function markFirstVisitProgressFromPathname(pathname: string): void {
  const stage = pathnameToFirstVisitProgressStage(pathname);
  if (stage) setFirstVisitProgressStage(stage);
}
