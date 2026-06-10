"use client";

import { useSearchParams } from "next/navigation";

import { LoginClient } from "./LoginClient";

/** useSearchParams を Suspense 境界内で読み、LoginClient へ渡す */
export function LoginParamsBridge() {
  const searchParams = useSearchParams();
  return <LoginClient returnToRaw={searchParams.get("returnTo")} />;
}
