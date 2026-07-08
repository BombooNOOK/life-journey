"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { FirstVisitGuideCardPageLayout } from "@/components/guide/first-visit/FirstVisitGuideCardPageLayout";
import { FirstVisitGuideCardShell } from "@/components/guide/first-visit/FirstVisitGuideCardShell";
import { FirstVisitResidentRegistrationIntroOverlay } from "@/components/guide/first-visit/FirstVisitResidentRegistrationIntroOverlay";
import { OwlLoadingPanel } from "@/components/ui/OwlLoadingPanel";
import { firstVisitReadyNextHref } from "@/lib/onboarding/firstVisitWizard/readyNavigation";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import type { FirstVisitReadyBranch } from "@/lib/viewer/firstVisitReadyContext";

const LoginClient = dynamic(
  () => import("@/app/login/LoginClient").then((mod) => mod.LoginClient),
  {
    ssr: false,
    loading: () => (
      <OwlLoadingPanel layout="section" size="sm" label="登録フォームを読み込んでいます…" className="py-8" />
    ),
  },
);

/** 第4幕：森の住民登録（未ログイン向け・説明カード → フォーム） */
export function FirstVisitRegisterPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useFirebaseAuth();
  const isLoggedIn = Boolean(user?.email?.trim());
  const [redirecting, setRedirecting] = useState(false);
  const [showIntroOverlay, setShowIntroOverlay] = useState(true);
  /** 初回ロード時点でログイン済みだったか（登録完了直後の isLoggedIn 変化と区別） */
  const loggedInWhenAuthFirstResolved = useRef<boolean | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (loggedInWhenAuthFirstResolved.current === null) {
      loggedInWhenAuthFirstResolved.current = isLoggedIn;
      if (!isLoggedIn) return;

      let cancelled = false;
      setRedirecting(true);

      void fetch("/api/viewer/first-visit-ready-context", { credentials: "same-origin" })
        .then(async (res) => {
          if (!res.ok) throw new Error("context fetch failed");
          return (await res.json()) as { branch: FirstVisitReadyBranch };
        })
        .then((data) => {
          if (cancelled) return;
          const href = firstVisitReadyNextHref(data.branch);
          router.replace(href);
        })
        .catch(() => {
          if (!cancelled) router.replace(FIRST_VISIT_ROUTES.residentCard);
        });

      return () => {
        cancelled = true;
      };
    }
  }, [authLoading, isLoggedIn, router]);

  if (authLoading || redirecting || (isLoggedIn && loggedInWhenAuthFirstResolved.current === true)) {
    return (
      <OwlLoadingPanel
        layout="page"
        label="案内を読み込んでいます…"
        hint="フクロウが回っているあいだはそのままお待ちください。"
      />
    );
  }

  return (
    <FirstVisitGuideCardPageLayout stepLabel="森の住民登録" ariaLabel="森の住民登録">
      {showIntroOverlay ? (
        <FirstVisitResidentRegistrationIntroOverlay onNext={() => setShowIntroOverlay(false)} />
      ) : (
        <FirstVisitGuideCardShell bareOnMobile>
          <LoginClient
              returnToRaw={FIRST_VISIT_ROUTES.residentCard}
              flowIntent="register"
              appearance="firstVisitEmbedded"
          />
        </FirstVisitGuideCardShell>
      )}
    </FirstVisitGuideCardPageLayout>
  );
}
