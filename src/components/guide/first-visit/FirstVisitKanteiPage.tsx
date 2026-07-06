"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { buildLoginHref } from "@/app/login/loginFlow";
import {
  companionWritingGuideBodyClass,
  companionWritingGuidePrimaryButtonClass,
  companionWritingGuideTitleClass,
} from "@/components/journal/companion-writing/companionWritingGuideStyles";
import { OwlLoadingPanel } from "@/components/ui/OwlLoadingPanel";
import {
  FIRST_VISIT_LOGHOUSE_COMPLETE_BODY,
  FIRST_VISIT_LOGHOUSE_COMPLETE_BUTTON,
  FIRST_VISIT_LOGHOUSE_COMPLETE_ILLUSTRATION_SRC,
  FIRST_VISIT_LOGHOUSE_COMPLETE_TITLE,
  preloadFirstVisitLoghouseCompleteIllustration,
} from "@/lib/onboarding/firstVisitWizard/loghouseCompleteCopy";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import { setFirstVisitOrderGuideFlag } from "@/lib/onboarding/firstVisitWizard/session";

/** 第6幕：ログハウス完成 → 鑑定のやかたへ */
export function FirstVisitKanteiPage() {
  const router = useRouter();
  const { user, loading } = useFirebaseAuth();
  const isLoggedIn = Boolean(user?.email?.trim());
  const [illustrationReady, setIllustrationReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void preloadFirstVisitLoghouseCompleteIllustration().then(() => {
      if (!cancelled) setIllustrationReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!isLoggedIn) {
      router.replace(buildLoginHref(FIRST_VISIT_ROUTES.kantei, "login"));
    }
  }, [isLoggedIn, loading, router]);

  const handleProceed = useCallback(() => {
    setFirstVisitOrderGuideFlag();
    router.push("/order");
  }, [router]);

  if (loading || !isLoggedIn || !illustrationReady) {
    return (
      <OwlLoadingPanel
        layout="page"
        label={loading || !isLoggedIn ? "ログイン状態を確認しています…" : "ログハウスの完成を読み込んでいます…"}
      />
    );
  }

  return (
    <section
      className="flex min-h-[100dvh] flex-col bg-gradient-to-b from-[#faf8f5] via-[#f7f4ef] to-[#f3efe8]"
      aria-labelledby="first-visit-loghouse-complete-heading"
    >
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="w-full max-w-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={FIRST_VISIT_LOGHOUSE_COMPLETE_ILLUSTRATION_SRC}
            alt=""
            className="mx-auto mb-6 max-h-[min(52vh,22rem)] w-auto max-w-full object-contain"
          />

          <h1 id="first-visit-loghouse-complete-heading" className={`text-center ${companionWritingGuideTitleClass}`}>
            {FIRST_VISIT_LOGHOUSE_COMPLETE_TITLE}
          </h1>

          <p className={`mt-4 whitespace-pre-line text-center leading-relaxed ${companionWritingGuideBodyClass}`}>
            {FIRST_VISIT_LOGHOUSE_COMPLETE_BODY}
          </p>

          <button type="button" className={`mt-8 ${companionWritingGuidePrimaryButtonClass}`} onClick={handleProceed}>
            {FIRST_VISIT_LOGHOUSE_COMPLETE_BUTTON}
          </button>
        </div>
      </div>
    </section>
  );
}
