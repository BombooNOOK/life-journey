import { Suspense } from "react";

import { LoginGate } from "./LoginGate";

export const metadata = {
  title: "ログイン",
};

function LoginLoading() {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-stone-200 bg-white p-8 text-center shadow-sm">
      <p className="text-sm text-stone-600">読み込み中…</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginGate />
    </Suspense>
  );
}
