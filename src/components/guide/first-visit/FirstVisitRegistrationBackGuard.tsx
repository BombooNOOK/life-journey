"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { isFirstVisitLoghouseReturnTo } from "@/app/login/loginFlow";
import { useBlockBrowserBack } from "@/hooks/useBlockBrowserBack";
import {
  isGoogleOAuthFlowCookieActive,
  readOAuthReturnPendingAgeMs,
} from "@/lib/auth/clientCookies";
import { readFirstVisitFromRegisterFlag } from "@/lib/onboarding/firstVisitWizard/session";

type Props = {
  children?: ReactNode;
  returnTo?: string | null;
  flowIntent?: "login" | "register" | null;
};

/** 住民登録〜住民票発行中はスワイプ戻りを無効化（/login の Google 戻りも含む） */
export function FirstVisitRegistrationBackGuard({
  children,
  returnTo,
  flowIntent,
}: Props) {
  const pathname = usePathname();
  const [fromRegister, setFromRegister] = useState(false);
  const [oauthPending, setOauthPending] = useState(false);

  useEffect(() => {
    const sync = () => {
      setFromRegister(readFirstVisitFromRegisterFlag());
      setOauthPending(
        isGoogleOAuthFlowCookieActive() || readOAuthReturnPendingAgeMs() != null,
      );
    };
    sync();
    window.addEventListener("pageshow", sync);
    return () => window.removeEventListener("pageshow", sync);
  }, [pathname]);

  const firstVisitLoginHandoff =
    pathname === "/login" &&
    (flowIntent === "register" ||
      (returnTo != null && isFirstVisitLoghouseReturnTo(returnTo)));

  const blockBack =
    pathname.startsWith("/guide/first/") ||
    fromRegister ||
    oauthPending ||
    firstVisitLoginHandoff;

  useBlockBrowserBack(blockBack);

  return children ?? null;
}
