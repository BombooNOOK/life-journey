"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { buildLoginHref } from "@/app/login/loginFlow";
import { isLjLoggedInOnClient } from "@/lib/auth/clientCookies";
import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { FirstVisitResidentCardContent } from "@/components/guide/first-visit/FirstVisitResidentCardContent";
import { OwlLoadingPanel } from "@/components/ui/OwlLoadingPanel";
import { getFirebaseAuth, waitForFirebaseAuthPersistence } from "@/lib/firebase/client";
import type { ForestResidentCardData } from "@/lib/forestResident/forestResidentNumber";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import {
  readFirstVisitFromRegisterFlag,
  readFirstVisitWelcomeEmailSentFlag,
  setFirstVisitFromRegisterFlag,
} from "@/lib/onboarding/firstVisitWizard/session";

const AUTH_SETTLE_TIMEOUT_MS = 20_000;

function hasRegisterHandoff(): boolean {
  return readFirstVisitFromRegisterFlag() || isLjLoggedInOnClient();
}

/** 第5幕①：住民票カード発行 */
export function FirstVisitResidentCardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useFirebaseAuth();
  const isLoggedIn = Boolean(user?.email?.trim());
  const [card, setCard] = useState<ForestResidentCardData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [authSettling, setAuthSettling] = useState(() => hasRegisterHandoff() && !isLoggedIn);

  useEffect(() => {
    if (isLoggedIn) {
      setAuthSettling(false);
      return;
    }
    if (!hasRegisterHandoff()) return;

    let cancelled = false;
    setAuthSettling(true);

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
      if (!cancelled) setAuthSettling(false);
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
          setFirstVisitFromRegisterFlag();
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError("住民票カードを読み込めませんでした。");
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, isLoggedIn]);

  const [navigating, setNavigating] = useState(false);

  const handleNext = useCallback(() => {
    setNavigating(true);
    router.replace(FIRST_VISIT_ROUTES.loghouseSign);
  }, [router]);

  if (authLoading || authSettling || !isLoggedIn || (!card && !loadError) || navigating) {
    return (
      <OwlLoadingPanel
        layout="page"
        label={
          navigating
            ? "ログハウスへの案内を準備しています…"
            : "住民票カードを発行しています…"
        }
        hint="フクロウが回っているあいだはそのままお待ちください。"
      />
    );
  }

  if (loadError || !card) {
    return (
      <OwlLoadingPanel layout="page" label={loadError ?? "住民票カードを読み込めませんでした。"} />
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
