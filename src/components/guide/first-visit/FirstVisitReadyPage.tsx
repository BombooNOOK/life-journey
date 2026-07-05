"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { buildLoginHref } from "@/app/login/loginFlow";
import { FirstVisitGuideCardStack } from "@/components/guide/first-visit/FirstVisitGuideCardStack";
import { FirstVisitGuideStage } from "@/components/guide/first-visit/FirstVisitGuideStage";
import { FirstVisitWizardPageHeader } from "@/components/guide/first-visit/FirstVisitWizardPageHeader";
import type { FirstVisitGuideCard, FirstVisitGuideCardAction } from "@/lib/onboarding/firstVisitWizard/cards";
import {
  FIRST_VISIT_KANTEI_HALL_INTRO_CARD,
  FIRST_VISIT_KANTEI_PROCEED_READY_CARD,
  FIRST_VISIT_RESIDENT_REGISTRATION_CARD,
} from "@/lib/onboarding/firstVisitWizard/cards";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import { setFirstVisitFromRegisterFlag } from "@/lib/onboarding/firstVisitWizard/session";
import type { FirstVisitReadyBranch } from "@/lib/viewer/firstVisitReadyContext";
import { OwlLoadingPanel } from "@/components/ui/OwlLoadingPanel";

type ReadyContextState =
  | { status: "loading" }
  | { status: "ready"; branch: FirstVisitReadyBranch };

/** 第4幕：鑑定のやかた案内 → アカウント状態で分岐 */
export function FirstVisitReadyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useFirebaseAuth();
  const isLoggedIn = Boolean(user?.email?.trim());

  const [index, setIndex] = useState(0);
  const [readyContext, setReadyContext] = useState<ReadyContextState>({ status: "loading" });
  const [branchAfterHall, setBranchAfterHall] = useState<FirstVisitReadyBranch | null>(null);

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
    setIndex(0);
    setBranchAfterHall(null);
  }, [isLoggedIn, readyContext.status === "ready" ? readyContext.branch : null]);

  const branchCard = useMemo((): FirstVisitGuideCard | null => {
    const branch = branchAfterHall ?? (readyContext.status === "ready" ? readyContext.branch : null);
    if (!branch || branch === "hasKantei") return null;
    if (branch === "guest") return FIRST_VISIT_RESIDENT_REGISTRATION_CARD;
    return FIRST_VISIT_KANTEI_PROCEED_READY_CARD;
  }, [branchAfterHall, readyContext]);

  const cards = useMemo(() => {
    const stack = [FIRST_VISIT_KANTEI_HALL_INTRO_CARD];
    if (index >= 1 && branchCard) stack.push(branchCard);
    return stack;
  }, [index, branchCard]);

  const handleHallNext = useCallback(() => {
    if (readyContext.status !== "ready") return;

    if (readyContext.branch === "hasKantei") {
      router.push("/orders");
      return;
    }

    setBranchAfterHall(readyContext.branch);
    setIndex(1);
  }, [readyContext, router]);

  const handleAction = useCallback(
    (action: FirstVisitGuideCardAction, cardId: string) => {
      if (action === "next") {
        if (cardId === "kantei-hall-intro") {
          handleHallNext();
          return;
        }
        if (cardId === "kantei-proceed-ready") {
          router.push(FIRST_VISIT_ROUTES.kantei);
          return;
        }
        router.push(FIRST_VISIT_ROUTES.kantei);
        return;
      }

      if (action === "register") {
        setFirstVisitFromRegisterFlag();
        router.push(buildLoginHref(FIRST_VISIT_ROUTES.loghouse, "register"));
        return;
      }

      if (action === "login") {
        router.push(buildLoginHref(FIRST_VISIT_ROUTES.kantei, "login"));
      }
    },
    [handleHallNext, router],
  );

  const pageLoading = authLoading || readyContext.status === "loading";

  if (pageLoading) {
    return (
      <OwlLoadingPanel
        layout="page"
        label="案内を読み込んでいます…"
        hint="フクロウが回っているあいだはそのままお待ちください。"
      />
    );
  }

  return (
    <div className="home-read-scope min-h-[100dvh] pb-10">
      <FirstVisitWizardPageHeader stepLabel="鑑定のやかた" className="px-4 pt-6 sm:px-6" />
      <FirstVisitGuideStage ariaLabel="鑑定のやかたへの案内">
        <FirstVisitGuideCardStack cards={cards} index={index} onAction={handleAction} />
      </FirstVisitGuideStage>
    </div>
  );
}
