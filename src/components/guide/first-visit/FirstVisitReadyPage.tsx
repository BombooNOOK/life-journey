"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { buildLoginHref } from "@/app/login/loginFlow";
import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { FirstVisitGuideCardPageLayout } from "@/components/guide/first-visit/FirstVisitGuideCardPageLayout";
import { FirstVisitGuideCardPanel } from "@/components/guide/first-visit/FirstVisitGuideCardStack";
import { OwlLoadingPanel } from "@/components/ui/OwlLoadingPanel";
import { preloadGuideImage } from "@/lib/guide/preloadGuideImage";
import type { FirstVisitGuideCardAction } from "@/lib/onboarding/firstVisitWizard/cards";
import {
  FIRST_VISIT_KANTEI_HALL_INTRO_CARD,
  FIRST_VISIT_RESIDENT_OWL_PROMPT_CARD,
} from "@/lib/onboarding/firstVisitWizard/cards";
import { firstVisitGuestOwlPromptIllustration, firstVisitGuideIllustrationForHref } from "@/lib/onboarding/firstVisitWizard/guideIllustrationAssets";
import { firstVisitReadyNextHref } from "@/lib/onboarding/firstVisitWizard/readyNavigation";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import type { FirstVisitReadyBranch } from "@/lib/viewer/firstVisitReadyContext";

type ReadyContextState =
  | { status: "loading" }
  | { status: "ready"; branch: FirstVisitReadyBranch };

/** 第4幕：鑑定のやかた案内 → 次で分岐ページへ */
export function FirstVisitReadyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useFirebaseAuth();
  const isLoggedIn = Boolean(user?.email?.trim());
  const [readyContext, setReadyContext] = useState<ReadyContextState>({ status: "loading" });
  const [navigating, setNavigating] = useState(false);
  const [guestCardIndex, setGuestCardIndex] = useState(0);

  useEffect(() => {
    if (authLoading) return;

    if (!isLoggedIn) {
      setReadyContext({ status: "ready", branch: "guest" });
      return;
    }

    let cancelled = false;
    void fetch("/api/viewer/first-visit-ready-context", { credentials: "same-origin" })
      .then(async (res) => {
        if (!res.ok) throw new Error("context fetch failed");
        return (await res.json()) as { branch: FirstVisitReadyBranch };
      })
      .then((data) => {
        if (!cancelled) setReadyContext({ status: "ready", branch: data.branch });
      })
      .catch(() => {
        if (!cancelled) setReadyContext({ status: "ready", branch: "needsKantei" });
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, isLoggedIn]);

  useEffect(() => {
    if (readyContext.status !== "ready") return;

    if (readyContext.branch === "guest") {
      void preloadGuideImage(firstVisitGuestOwlPromptIllustration());
      return;
    }

    const nextHref = firstVisitReadyNextHref(readyContext.branch);
    const nextImage = firstVisitGuideIllustrationForHref(nextHref);
    if (nextImage) void preloadGuideImage(nextImage);
  }, [readyContext]);

  const handleAction = useCallback(
    async (action: FirstVisitGuideCardAction, cardId: string) => {
      if (readyContext.status !== "ready") return;

      if (action === "login" && cardId === "resident-owl-prompt") {
        router.push(buildLoginHref(FIRST_VISIT_ROUTES.kantei, "login"));
        return;
      }

      if (action !== "next") return;

      if (readyContext.branch === "guest") {
        if (cardId === "kantei-hall-intro" && guestCardIndex === 0) {
          setGuestCardIndex(1);
          return;
        }
        if (cardId === "resident-owl-prompt") {
          setNavigating(true);
          router.push(FIRST_VISIT_ROUTES.register);
        }
        return;
      }

      if (cardId !== "kantei-hall-intro") return;

      const href = firstVisitReadyNextHref(readyContext.branch);
      const nextImage = firstVisitGuideIllustrationForHref(href);
      setNavigating(true);
      if (nextImage) await preloadGuideImage(nextImage);
      router.push(href);
    },
    [guestCardIndex, readyContext, router],
  );

  const pageLoading = authLoading || readyContext.status === "loading";

  if (pageLoading || navigating) {
    return (
      <OwlLoadingPanel
        layout="page"
        label={navigating ? "次の案内を準備しています…" : "案内を読み込んでいます…"}
        hint="フクロウが回っているあいだはそのままお待ちください。"
      />
    );
  }

  return (
    <FirstVisitGuideCardPageLayout
      stepLabel={readyContext.branch === "guest" && guestCardIndex === 1 ? "森の住民登録" : "鑑定のやかた"}
      ariaLabel={
        readyContext.branch === "guest" && guestCardIndex === 1
          ? "森の住民登録の案内"
          : "鑑定のやかたへの案内"
      }
    >
      <FirstVisitGuideCardPanel
        card={
          readyContext.branch === "guest" && guestCardIndex === 1
            ? FIRST_VISIT_RESIDENT_OWL_PROMPT_CARD
            : FIRST_VISIT_KANTEI_HALL_INTRO_CARD
        }
        onAction={handleAction}
      />
    </FirstVisitGuideCardPageLayout>
  );
}
