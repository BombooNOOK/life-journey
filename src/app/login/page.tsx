import { Suspense } from "react";

import { OwlSuspenseFallback } from "@/components/ui/OwlSuspenseFallback";

import { LoginGate } from "./LoginGate";

export const metadata = {
  title: "ログイン",
};

function LoginLoading() {
  return <OwlSuspenseFallback label="ログイン画面を読み込んでいます…" />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginGate />
    </Suspense>
  );
}
