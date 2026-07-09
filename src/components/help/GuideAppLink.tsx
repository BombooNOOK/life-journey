"use client";

import type { ReactNode } from "react";

import { OnboardingLockedTap } from "@/components/onboarding/OnboardingLockedTap";
import { useOnboardingStage } from "@/components/onboarding/OnboardingStageProvider";
import { AppTransitionLink } from "@/components/ui/AppTransitionLink";
import type { OnboardingFeature } from "@/lib/onboarding/onboardingStage";

type Props = {
  href: string;
  label: ReactNode;
  feature?: OnboardingFeature;
};

export function GuideAppLink({ href, label, feature }: Props) {
  const { isFeatureUnlocked } = useOnboardingStage();

  if (!feature || isFeatureUnlocked(feature)) {
    return (
      <p className="mt-3">
        <AppTransitionLink
          href={href}
          className="font-medium text-emerald-900 underline-offset-2 hover:underline active:opacity-70"
        >
          {label} →
        </AppTransitionLink>
      </p>
    );
  }

  return (
    <OnboardingLockedTap feature={feature} className="mt-3">
      <span className="font-medium text-emerald-900/45 underline-offset-2">{label} →</span>
    </OnboardingLockedTap>
  );
}
