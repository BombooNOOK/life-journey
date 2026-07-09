"use client";

import { useCallback, useState, type ReactNode } from "react";

import { useOnboardingStage } from "@/components/onboarding/OnboardingStageProvider";
import type { OnboardingFeature } from "@/lib/onboarding/onboardingStage";

type Props = {
  feature: OnboardingFeature;
  children: ReactNode;
  className?: string;
  lockedClassName?: string;
};

/** ロック時はタップで説明カードを表示 */
export function OnboardingLockedTap({
  feature,
  children,
  className = "",
  lockedClassName = "opacity-45",
}: Props) {
  const { ready, isFeatureUnlocked, lockMessage } = useOnboardingStage();
  const [notice, setNotice] = useState<string | null>(null);
  const unlocked = isFeatureUnlocked(feature);

  const handleTap = useCallback(() => {
    if (!ready || unlocked) return;
    setNotice(lockMessage(feature));
    window.setTimeout(() => setNotice(null), 4200);
  }, [feature, lockMessage, ready, unlocked]);

  if (!ready) {
    return (
      <div className={className} aria-busy="true">
        {children}
      </div>
    );
  }

  return (
    <div className={["relative", className].filter(Boolean).join(" ")}>
      <div
        className={unlocked ? "" : lockedClassName}
        onClick={unlocked ? undefined : handleTap}
        onKeyDown={
          unlocked
            ? undefined
            : (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleTap();
                }
              }
        }
        role={unlocked ? undefined : "button"}
        tabIndex={unlocked ? undefined : 0}
        aria-disabled={unlocked ? undefined : true}
      >
        {children}
      </div>

      {notice ? (
        <div
          role="status"
          className="absolute inset-x-0 bottom-full z-50 mb-2 rounded-xl border border-emerald-200/90 bg-[#fffdf9] px-3 py-2.5 text-left text-xs leading-relaxed text-stone-700 shadow-lg"
        >
          {notice}
        </div>
      ) : null}
    </div>
  );
}
