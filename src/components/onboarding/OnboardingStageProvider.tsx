"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { isLjLoggedInOnClient } from "@/lib/auth/clientCookies";
import {
  isOnboardingComplete,
  isOnboardingFeatureUnlocked,
  onboardingLockMessage,
  resolveOnboardingNextStep,
  resolveOnboardingStage,
  type OnboardingFeature,
  type OnboardingStage,
} from "@/lib/onboarding/onboardingStage";
import { inferChapter1Complete } from "@/lib/onboarding/firstVisitWizard/chapterProgress";
import { readFirstVisitProgressStage } from "@/lib/onboarding/firstVisitWizard/progress";
import {
  readFirstVisitChapterCompleteFlag,
  readOnboardingChapter1CompleteCookie,
} from "@/lib/onboarding/firstVisitWizard/session";
import type { OnboardingStageContext } from "@/lib/viewer/onboardingStageContext";
import type { FirstVisitReadyBranch } from "@/lib/viewer/firstVisitReadyContext";

type OnboardingStageProviderValue = {
  ready: boolean;
  context: OnboardingStageContext;
  stage: OnboardingStage;
  isComplete: boolean;
  isFeatureUnlocked: (feature: OnboardingFeature) => boolean;
  lockMessage: (feature: OnboardingFeature) => string;
  refresh: () => void;
};

const BOOTSTRAP: OnboardingStageContext = {
  isLoggedIn: false,
  stage: 0,
  chapter1Complete: false,
  hasKanteiOrder: false,
  journalEntryCount: 0,
  nextStep: null,
};

const OnboardingStageContextReact = createContext<OnboardingStageProviderValue | null>(null);

function mergeStageContext(server: OnboardingStageContext): OnboardingStageContext {
  const hasKanteiOrder =
    server.hasKanteiOrder || readFirstVisitChapterCompleteFlag(2);
  const branch: FirstVisitReadyBranch = !server.isLoggedIn
    ? "guest"
    : hasKanteiOrder
      ? "hasKantei"
      : "needsKantei";
  const chapter1Complete =
    server.chapter1Complete ||
    readFirstVisitChapterCompleteFlag(1) ||
    readOnboardingChapter1CompleteCookie() ||
    inferChapter1Complete({
      branch,
      journalEntryCount: server.journalEntryCount,
      savedStage: readFirstVisitProgressStage(),
      chapter1CompleteFlag: readFirstVisitChapterCompleteFlag(1),
      chapter2CompleteFlag: readFirstVisitChapterCompleteFlag(2),
      chapter3CompleteFlag: readFirstVisitChapterCompleteFlag(3),
      chapter3StartedFlag: false,
      bookshelfKanteiGuide: false,
      orderGuide: false,
      fromRegisterHandoff: false,
    });

  const stage = resolveOnboardingStage({
    isLoggedIn: server.isLoggedIn,
    chapter1Complete,
    hasKanteiOrder,
    journalEntryCount: server.journalEntryCount,
  });

  return {
    ...server,
    chapter1Complete,
    hasKanteiOrder,
    stage,
    nextStep: resolveOnboardingNextStep(stage),
  };
}

export function OnboardingStageProvider({ children }: { children: ReactNode }) {
  const { user } = useFirebaseAuth();
  const [ready, setReady] = useState(false);
  const [serverContext, setServerContext] = useState<OnboardingStageContext>(BOOTSTRAP);
  const [refreshToken, setRefreshToken] = useState(0);

  const refresh = useCallback(() => {
    setRefreshToken((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const isLoggedIn = Boolean(user) || isLjLoggedInOnClient();

    setReady(false);
    if (isLoggedIn) {
      setServerContext(mergeStageContext({ ...BOOTSTRAP, isLoggedIn: true }));
    } else {
      setServerContext(BOOTSTRAP);
    }

    void fetch("/api/viewer/onboarding-stage-context", { credentials: "same-origin" })
      .then(async (res) => {
        if (!res.ok) throw new Error("onboarding context fetch failed");
        return (await res.json()) as OnboardingStageContext;
      })
      .then((data) => {
        if (cancelled) return;
        setServerContext({
          ...data,
          isLoggedIn: data.isLoggedIn || isLoggedIn,
        });
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setServerContext({
          ...BOOTSTRAP,
          isLoggedIn,
        });
        setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [user, refreshToken]);

  const context = useMemo(
    () => mergeStageContext(serverContext),
    [serverContext],
  );

  const value = useMemo<OnboardingStageProviderValue>(() => {
    const stage = context.stage;
    return {
      ready,
      context,
      stage,
      isComplete: isOnboardingComplete(stage),
      isFeatureUnlocked: (feature) => isOnboardingFeatureUnlocked(stage, feature),
      lockMessage: (feature) => onboardingLockMessage(feature),
      refresh,
    };
  }, [context, ready, refresh]);

  return (
    <OnboardingStageContextReact.Provider value={value}>
      {children}
    </OnboardingStageContextReact.Provider>
  );
}

export function useOnboardingStage(): OnboardingStageProviderValue {
  const value = useContext(OnboardingStageContextReact);
  if (!value) {
    throw new Error("useOnboardingStage must be used within OnboardingStageProvider");
  }
  return value;
}

export function useOptionalOnboardingStage(): OnboardingStageProviderValue | null {
  return useContext(OnboardingStageContextReact);
}
