"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { FirstVisitRegistrationBackGuard } from "@/components/guide/first-visit/FirstVisitRegistrationBackGuard";
import { OwlLoadingPanel } from "@/components/ui/OwlLoadingPanel";
import { isFirstVisitLoghouseReturnTo } from "@/app/login/loginFlow";
import { isLegacyStandaloneOrderRegisterReturnTo } from "@/lib/onboarding/firstVisitWizard/entry";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";

import type { LoginFlowIntent } from "./loginFlow";
import { LoginClient } from "./LoginClient";

function parseFlowIntent(raw: string | null): LoginFlowIntent | null {
  if (raw === "login" || raw === "register") return raw;
  return null;
}

function shouldRedirectToFirstVisitWelcome(
  returnTo: string | null,
  flowIntent: LoginFlowIntent | null,
): boolean {
  if (isLegacyStandaloneOrderRegisterReturnTo(returnTo)) {
    return flowIntent !== "login";
  }
  if (flowIntent !== "register") return false;
  if (!returnTo) return true;
  return !isFirstVisitLoghouseReturnTo(returnTo);
}

/** useSearchParams を Suspense 境界内で読み、LoginClient へ渡す */
export function LoginParamsBridge() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const flowIntent = parseFlowIntent(searchParams.get("flow"));
  const legacyOrderRegister = shouldRedirectToFirstVisitWelcome(returnTo, flowIntent);
  const [redirecting, setRedirecting] = useState(legacyOrderRegister);

  useEffect(() => {
    if (!legacyOrderRegister) {
      setRedirecting(false);
      return;
    }
    router.replace(FIRST_VISIT_ROUTES.welcome);
  }, [legacyOrderRegister, router]);

  if (redirecting) {
    return (
      <OwlLoadingPanel
        layout="page"
        label="はじめての方の案内へ進みます…"
        hint="森の案内図から、順番にご案内します。"
      />
    );
  }

  return (
    <FirstVisitRegistrationBackGuard returnTo={returnTo} flowIntent={flowIntent}>
      <LoginClient returnToRaw={returnTo} flowIntent={flowIntent} />
    </FirstVisitRegistrationBackGuard>
  );
}
