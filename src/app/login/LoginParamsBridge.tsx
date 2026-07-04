"use client";

import { useSearchParams } from "next/navigation";

import type { LoginFlowIntent } from "./loginFlow";
import { LoginClient } from "./LoginClient";

function parseFlowIntent(raw: string | null): LoginFlowIntent | null {
  if (raw === "login" || raw === "register") return raw;
  return null;
}

/** useSearchParams を Suspense 境界内で読み、LoginClient へ渡す */
export function LoginParamsBridge() {
  const searchParams = useSearchParams();
  return (
    <LoginClient
      returnToRaw={searchParams.get("returnTo")}
      flowIntent={parseFlowIntent(searchParams.get("flow"))}
    />
  );
}
