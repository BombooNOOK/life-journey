"use client";

import { isLjLoggedInOnClient } from "@/lib/auth/clientCookies";
import { ONBOARDING_STAGE_SYNC_LABEL } from "@/lib/onboarding/onboardingStageSyncCopy";
import { useOnboardingStage } from "@/components/onboarding/OnboardingStageProvider";

/** 再開直後など、段階ロックの判定が終わるまでの案内 */
export function OnboardingStageSyncBanner() {
  const { ready, context } = useOnboardingStage();

  if (ready) return null;
  if (!context.isLoggedIn && !isLjLoggedInOnClient()) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[max(0.35rem,env(safe-area-inset-top))] z-[60] flex justify-center px-4"
      aria-live="polite"
      role="status"
    >
      <p className="rounded-full border border-stone-200/90 bg-white/95 px-3.5 py-1.5 text-xs font-medium text-stone-600 shadow-sm backdrop-blur-sm">
        {ONBOARDING_STAGE_SYNC_LABEL}
      </p>
    </div>
  );
}
