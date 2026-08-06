import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import { journalWithCompanionPath } from "@/lib/journal/journalNav";

/** 第3章の「次の一歩」：看板ではなく机（伴走執筆）へ。看板は道しるべ専用の演出。 */
export const ONBOARDING_CHAPTER3_DESK_WRITING_HREF = journalWithCompanionPath("/orders");

/** 0=未登録 1=登録済・ログハウス未完成 2=ログハウス完成 3=鑑定完了 4=あしあと1件以上 */
export type OnboardingStage = 0 | 1 | 2 | 3 | 4;

export type OnboardingStageInput = {
  isLoggedIn: boolean;
  chapter1Complete: boolean;
  hasKanteiOrder: boolean;
  journalEntryCount: number;
};

export type OnboardingFeature =
  | "forest_loghouse"
  | "forest_companion"
  | "bottom_calendar"
  | "bottom_list"
  | "bottom_bookshelf"
  | "bottom_loghouse"
  | "guide_loghouse"
  | "guide_bookshelf"
  | "guide_calendar"
  | "guide_list"
  | "guide_companion";

const FEATURE_MIN_STAGE: Record<OnboardingFeature, OnboardingStage> = {
  forest_loghouse: 1,
  forest_companion: 3,
  bottom_loghouse: 1,
  bottom_calendar: 3,
  bottom_list: 3,
  bottom_bookshelf: 3,
  guide_loghouse: 1,
  guide_bookshelf: 3,
  guide_calendar: 3,
  guide_list: 3,
  guide_companion: 3,
};

export function resolveOnboardingStage(input: OnboardingStageInput): OnboardingStage {
  if (!input.isLoggedIn) return 0;
  if (input.journalEntryCount > 0) return 4;
  if (input.hasKanteiOrder) return 3;
  if (input.chapter1Complete) return 2;
  return 1;
}

export function isOnboardingComplete(stage: OnboardingStage): boolean {
  return stage >= 4;
}

export function isOnboardingFeatureUnlocked(
  stage: OnboardingStage,
  feature: OnboardingFeature,
): boolean {
  return stage >= FEATURE_MIN_STAGE[feature];
}

export function onboardingLockMessage(feature: OnboardingFeature): string {
  const min = FEATURE_MIN_STAGE[feature];
  if (min <= 1) {
    return "はじめての道しるべから、住民登録とログハウスづくりを進めてください。";
  }
  if (min === 2) {
    return "住民登録とログハウスづくりが終わると、ここから入れます。";
  }
  return "無料鑑定が終わると、ここから使えるようになります。";
}

export type OnboardingNextStep = {
  href: string;
  label: string;
  body: string;
};

export type OnboardingNextStepOptions = {
  /** @deprecated 第3章バナーは看板に戻さないため未使用（互換のため残す） */
  chapter3Started?: boolean;
  /** すでに伴走執筆画面にいるときはバナー不要 */
  onCompanionWritingPath?: boolean;
};

export function resolveOnboardingNextStep(
  stage: OnboardingStage,
  options: OnboardingNextStepOptions = {},
): OnboardingNextStep | null {
  if (stage >= 4) return null;

  if (stage === 0) {
    return {
      href: FIRST_VISIT_ROUTES.pathGuide,
      label: "はじめての道しるべへ",
      body: "まずは道しるべから、プロローグと第1章を進めましょう。",
    };
  }

  if (stage === 1) {
    return {
      href: FIRST_VISIT_ROUTES.pathGuide,
      label: "ログハウスづくりの続きへ",
      body: "道しるべの第1章から、ログハウス建築を続けましょう。",
    };
  }

  if (stage === 2) {
    return {
      href: FIRST_VISIT_ROUTES.pathGuide,
      label: "第2章・鑑定へ",
      body: "道しるべの第2章から、無料鑑定を受けましょう。",
    };
  }

  if (stage === 3) {
    // 看板へ戻すとログハウス⇄看板の迷子ループになる。常に机（伴走）へ。
    if (options.onCompanionWritingPath) return null;
    return {
      href: ONBOARDING_CHAPTER3_DESK_WRITING_HREF,
      label: "机であしあとを残す",
      body: "ログハウスの机から、どうぶつ鑑定士といっしょに、はじめてのあしあとを書いてみましょう。",
    };
  }

  return null;
}

/**
 * `/orders/[id]` と紛らわしい固定セグメント。
 * これらを注文詳細扱いにすると、鑑定前に道しるべへ誤誘導される。
 */
const ORDERS_STATIC_FIRST_SEGMENTS = new Set([
  "account",
  "bookshelf",
  "calendar",
  "go-out",
  "garden",
  "list",
  "mailbox",
  "kantei-hall",
  "profile",
  "resident-card",
  "settings",
  "support",
  "write",
]);

/** 直URLアクセス時の最低段階（案内所・道しるべ・ログイン等は含まない） */
export function resolvePathMinOnboardingStage(pathname: string): OnboardingStage | null {
  if (pathname === "/orders") return 1;
  if (pathname.startsWith("/orders/calendar")) return 3;
  if (pathname.startsWith("/orders/list")) return 3;
  if (pathname.startsWith("/orders/bookshelf")) return 3;
  if (pathname.startsWith("/orders/write")) return 3;
  if (pathname.startsWith("/journal")) return 3;

  // `/orders/[orderId]` および `/orders/[orderId]/…`（account / settings 等は除外）
  const ordersSegment = pathname.match(/^\/orders\/([^/]+)(?:\/|$)/);
  if (ordersSegment && !ORDERS_STATIC_FIRST_SEGMENTS.has(ordersSegment[1])) {
    return 3;
  }
  return null;
}

export function isPathAllowedForStage(pathname: string, stage: OnboardingStage): boolean {
  const required = resolvePathMinOnboardingStage(pathname);
  if (required == null) return true;
  return stage >= required;
}
