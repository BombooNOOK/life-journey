"use client";

import dynamic from "next/dynamic";

import { OwlSuspenseFallback } from "@/components/ui/OwlSuspenseFallback";

const LoginParamsBridge = dynamic(
  () => import("./LoginParamsBridge").then((m) => ({ default: m.LoginParamsBridge })),
  {
    ssr: false,
    loading: () => (
      <OwlSuspenseFallback label="ログイン画面を読み込んでいます…" />
    ),
  },
);

export function LoginGate() {
  return <LoginParamsBridge />;
}
