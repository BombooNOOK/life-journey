"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { buildLoginHref } from "@/app/login/loginFlow";
import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { FirstVisitResidentCardContent } from "@/components/guide/first-visit/FirstVisitResidentCardContent";
import { OwlLoadingPanel } from "@/components/ui/OwlLoadingPanel";
import type { ForestResidentCardData } from "@/lib/forestResident/forestResidentNumber";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import {
  readFirstVisitWelcomeEmailSentFlag,
  setFirstVisitFromRegisterFlag,
} from "@/lib/onboarding/firstVisitWizard/session";

/** 第5幕①：住民票カード発行 */
export function FirstVisitResidentCardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useFirebaseAuth();
  const isLoggedIn = Boolean(user?.email?.trim());
  const [card, setCard] = useState<ForestResidentCardData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  const handleNext = useCallback(() => {
    router.push(FIRST_VISIT_ROUTES.loghouseSign);
  }, [router]);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      router.replace(buildLoginHref(FIRST_VISIT_ROUTES.residentCard, "login"));
    }
  }, [authLoading, isLoggedIn, router]);

  if (authLoading || !isLoggedIn || (!card && !loadError)) {
    return (
      <OwlLoadingPanel
        layout="page"
        label="住民票カードを発行しています…"
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
