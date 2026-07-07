"use client";

import { useSearchParams } from "next/navigation";

import { FirstVisitRegistrationBackGuard } from "@/components/guide/first-visit/FirstVisitRegistrationBackGuard";
import type { LoginFlowIntent } from "./loginFlow";
import { LoginClient } from "./LoginClient";

function parseFlowIntent(raw: string | null): LoginFlowIntent | null {
  if (raw === "login" || raw === "register") return raw;
  return null;
}

/** useSearchParams を Suspense 境界内で読み、LoginClient へ渡す */
export function LoginParamsBridge() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const flowIntent = parseFlowIntent(searchParams.get("flow"));

  return (
    <FirstVisitRegistrationBackGuard returnTo={returnTo} flowIntent={flowIntent}>
      <LoginClient returnToRaw={returnTo} flowIntent={flowIntent} />
    </FirstVisitRegistrationBackGuard>
  );
}
