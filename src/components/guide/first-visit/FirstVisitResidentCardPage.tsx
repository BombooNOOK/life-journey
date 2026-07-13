"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { buildLoginHref } from "@/app/login/loginFlow";
import { isLjLoggedInOnClient } from "@/lib/auth/clientCookies";
import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { FirstVisitResidentCardContent } from "@/components/guide/first-visit/FirstVisitResidentCardContent";
import { FirstVisitResidentCardVideoStage } from "@/components/guide/first-visit/FirstVisitResidentCardVideoStage";
import { useTransitionNavigation } from "@/components/ui/TransitionNavigationProvider";
import { OwlLoadingPanel } from "@/components/ui/OwlLoadingPanel";
import { pinFirstVisitRegistrationHistory } from "@/hooks/useBlockBrowserBack";
import { getFirebaseAuth, waitForFirebaseAuthPersistence } from "@/lib/firebase/client";
import type { ForestResidentCardData } from "@/lib/forestResident/forestResidentNumber";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import {
  FIRST_VISIT_RESIDENT_CARD_LOADING_HINT,
  FIRST_VISIT_RESIDENT_CARD_LOADING_LABEL,
} from "@/lib/onboarding/firstVisitWizard/loadingCopy";
import {
  readFirstVisitFromRegisterFlag,
  readFirstVisitResidentCardVideoDoneFlag,
  readFirstVisitWelcomeEmailSentFlag,
  setFirstVisitResidentCardVideoDoneFlag,
} from "@/lib/onboarding/firstVisitWizard/session";

const AUTH_SETTLE_TIMEOUT_MS = 20_000;

type ViewPhase = "video" | "card";

function hasRegisterHandoff(): boolean {
  return readFirstVisitFromRegisterFlag() || isLjLoggedInOnClient();
}

/** 第5幕①：住民票カード発行 */
export function FirstVisitResidentCardPage() {
  const router = useRouter();
  const { replace } = useTransitionNavigation();
  const { user, loading: authLoading } = useFirebaseAuth();
  const isLoggedIn = Boolean(user?.email?.trim());
  const [card, setCard] = useState<ForestResidentCardData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [authSettling, setAuthSettling] = useState(() => hasRegisterHandoff() && !isLoggedIn);
  const [authTimedOut, setAuthTimedOut] = useState(false);
  const [viewPhase, setViewPhase] = useState<ViewPhase>(() =>
    readFirstVisitResidentCardVideoDoneFlag() ? "card" : "video",
  );

  useEffect(() => {
    if (hasRegisterHandoff()) {
      pinFirstVisitRegistrationHistory();
    }
  }, []);

  useEffect(() => {
    if (readFirstVisitFromRegisterFlag() && !readFirstVisitResidentCardVideoDoneFlag()) {
      setViewPhase("video");
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      setAuthSettling(false);
      setAuthTimedOut(false);
      return;
    }
    if (!hasRegisterHandoff()) return;

    let cancelled = false;
    setAuthSettling(true);
    setAuthTimedOut(false);

    void (async () => {
      try {
        const auth = getFirebaseAuth({ deferPersistence: true });
        await waitForFirebaseAuthPersistence(auth);
        if (typeof auth.authStateReady === "function") {
          await auth.authStateReady();
        }
        const deadline = Date.now() + AUTH_SETTLE_TIMEOUT_MS;
        while (Date.now() < deadline && !cancelled) {
          if (auth.currentUser?.email?.trim()) {
            if (!cancelled) setAuthSettling(false);
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, 150));
          if (typeof auth.authStateReady === "function") {
            await auth.authStateReady();
          }
        }
      } catch {
        /* noop */
      }
      if (!cancelled) {
        setAuthSettling(false);
        setAuthTimedOut(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (authLoading || isLoggedIn || authSettling) return;
    if (hasRegisterHandoff()) return;

    router.replace(buildLoginHref(FIRST_VISIT_ROUTES.residentCard, "register"));
  }, [authLoading, authSettling, isLoggedIn, router]);

  useEffect(() => {
    if (authLoading || !isLoggedIn) return;

    let cancelled = false;
    void fetch("/api/viewer/forest-resident-card", {
      method: "POST",
      credentials: "same-origin",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("provision failed");
        return (await res.json()) as { card: ForestResidentCardData };
      })
      .then((data) => {
        if (!cancelled) {
          setCard(data.card);
          // 新規登録直後の handoff フラグは維持するが、再訪時に付け直さない
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError("住民票カードを読み込めませんでした。");
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, isLoggedIn]);

  const handleVideoComplete = useCallback(() => {
    setFirstVisitResidentCardVideoDoneFlag();
    setViewPhase("card");
  }, []);

  const handleNext = useCallback(() => {
    pinFirstVisitRegistrationHistory();
    replace(FIRST_VISIT_ROUTES.loghouseSign);
  }, [replace]);

  if (authTimedOut && !isLoggedIn) {
    return (
      <div className="mx-auto flex min-h-[70dvh] w-full max-w-md flex-col justify-center gap-4 px-4 py-10 text-center">
        <p className="text-base font-medium text-stone-800">ログイン状態を確認できませんでした</p>
        <p className="text-sm leading-relaxed text-stone-600">
          すでにログハウスで過ごしている場合は、住民票の再発行は不要です。ログハウスへ戻るか、もう一度ログインしてください。
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href="/orders"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-800 px-4 text-sm font-semibold text-white"
          >
            ログハウスへ戻る
          </Link>
          <Link
            href={buildLoginHref(FIRST_VISIT_ROUTES.kanteiReady, "login")}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-800"
          >
            ログインしなおす
          </Link>
          <Link
            href={FIRST_VISIT_ROUTES.pathGuide}
            className="text-sm text-stone-600 underline-offset-2 hover:underline"
          >
            はじめての道しるべへ
          </Link>
        </div>
      </div>
    );
  }

  if (authLoading || authSettling || !isLoggedIn) {
    return (
      <OwlLoadingPanel
        layout="page"
        label={FIRST_VISIT_RESIDENT_CARD_LOADING_LABEL}
        hint={FIRST_VISIT_RESIDENT_CARD_LOADING_HINT}
      />
    );
  }

  if (viewPhase === "video") {
    return <FirstVisitResidentCardVideoStage onComplete={handleVideoComplete} />;
  }

  if (loadError || !card) {
    return (
      <OwlLoadingPanel
        layout="page"
        label={loadError ?? FIRST_VISIT_RESIDENT_CARD_LOADING_LABEL}
        hint={loadError ? undefined : FIRST_VISIT_RESIDENT_CARD_LOADING_HINT}
      />
    );
  }

  return (
    <FirstVisitResidentCardContent
      card={card}
      showEmailNote={readFirstVisitWelcomeEmailSentFlag()}
      onNext={handleNext}
    />
  );
}
