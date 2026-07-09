"use client";

import Link from "next/link";

import { useOnboardingStage } from "@/components/onboarding/OnboardingStageProvider";

/** オンボーディング中は次の一歩を常に表示 */
export function OnboardingNextStepBanner() {
  const { ready, isComplete, context } = useOnboardingStage();

  if (!ready || isComplete || !context.nextStep) return null;

  const { href, label, body } = context.nextStep;

  return (
    <div className="mb-4 rounded-xl border border-emerald-200/90 bg-emerald-50/70 px-4 py-3 shadow-sm">
      <p className="text-sm leading-relaxed text-stone-700">{body}</p>
      <p className="mt-2">
        <Link
          href={href}
          className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-900"
        >
          {label} →
        </Link>
      </p>
    </div>
  );
}
