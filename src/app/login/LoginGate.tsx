"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const LoginClient = dynamic(() => import("./LoginClient").then((m) => ({ default: m.LoginClient })), {
  ssr: false,
  loading: () => (
    <div className="mx-auto max-w-md rounded-xl border border-stone-200 bg-white p-8 text-center shadow-sm">
      <p className="text-sm text-stone-600">読み込み中…</p>
    </div>
  ),
});

export function LoginGate() {
  return (
    <Suspense fallback={<p className="text-sm text-stone-500">読み込み中…</p>}>
      <LoginClient />
    </Suspense>
  );
}
