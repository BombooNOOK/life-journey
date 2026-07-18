import type { LogHouseRoomSpotId } from "@/lib/loghouse/logHouseRoomHotspots";
import type { FirstVisitGuideState } from "@/lib/onboarding/firstVisitGuideState";

export const LOGHOUSE_TOUR_DONE_STORAGE_KEY = "ljd:firstGuide:loghouseTourDone" as const;
export const LOGHOUSE_TOUR_STEP_STORAGE_KEY = "ljd:firstGuide:loghouseTourStep" as const;
export const LOGHOUSE_TOUR_RETURN_HREF_KEY = "ljd:firstGuide:loghouseTourReturnHref" as const;

export const LOGHOUSE_TOUR_STEPS = [
  "desk",
  "mailbox",
  "bookshelf",
  "hint",
  "wrapUp",
  "inviteWrite",
] as const;

export type LoghouseTourStepId = (typeof LOGHOUSE_TOUR_STEPS)[number];

export function isLoghouseTourStepId(value: string | null | undefined): value is LoghouseTourStepId {
  return Boolean(value && (LOGHOUSE_TOUR_STEPS as readonly string[]).includes(value));
}

export function spotlightSpotForTourStep(step: LoghouseTourStepId): LogHouseRoomSpotId | null {
  if (step === "desk" || step === "inviteWrite") return "desk";
  if (step === "mailbox") return "mailbox";
  if (step === "bookshelf") return "bookshelf";
  return null;
}

export function shouldOfferLoghouseTour(input: {
  firstVisitGuideState: FirstVisitGuideState;
  hasKantei: boolean;
  previewMode?: boolean;
}): boolean {
  if (input.previewMode) return false;
  if (!input.hasKantei) return false;
  // 鑑定済み・まだあしあと未作成＝はじめてのログハウス案内タイミング
  return input.firstVisitGuideState === "ready_first_journal";
}

export function readLoghouseTourDoneFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(LOGHOUSE_TOUR_DONE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setLoghouseTourDoneFlag(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOGHOUSE_TOUR_DONE_STORAGE_KEY, "1");
  } catch {
    // ignore
  }
  clearLoghouseTourStep();
  clearLoghouseTourReturnHref();
}

export function clearLoghouseTourDoneFlag(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LOGHOUSE_TOUR_DONE_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function readLoghouseTourStep(): LoghouseTourStepId | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(LOGHOUSE_TOUR_STEP_STORAGE_KEY);
    return isLoghouseTourStepId(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function setLoghouseTourStep(step: LoghouseTourStepId): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(LOGHOUSE_TOUR_STEP_STORAGE_KEY, step);
  } catch {
    // ignore
  }
}

export function clearLoghouseTourStep(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(LOGHOUSE_TOUR_STEP_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function readLoghouseTourReturnHref(): string {
  if (typeof window === "undefined") return "/orders";
  try {
    const raw = window.sessionStorage.getItem(LOGHOUSE_TOUR_RETURN_HREF_KEY)?.trim();
    if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  } catch {
    // ignore
  }
  return "/orders";
}

export function setLoghouseTourReturnHref(href: string): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = href.trim();
    if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return;
    window.sessionStorage.setItem(LOGHOUSE_TOUR_RETURN_HREF_KEY, trimmed);
  } catch {
    // ignore
  }
}

export function clearLoghouseTourReturnHref(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(LOGHOUSE_TOUR_RETURN_HREF_KEY);
  } catch {
    // ignore
  }
}

export function nextLoghouseTourStep(step: LoghouseTourStepId): LoghouseTourStepId | null {
  const index = LOGHOUSE_TOUR_STEPS.indexOf(step);
  if (index < 0 || index >= LOGHOUSE_TOUR_STEPS.length - 1) return null;
  return LOGHOUSE_TOUR_STEPS[index + 1] ?? null;
}
