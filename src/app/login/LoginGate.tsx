"use client";

import dynamic from "next/dynamic";

const LoginParamsBridge = dynamic(
  () => import("./LoginParamsBridge").then((m) => ({ default: m.LoginParamsBridge })),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto max-w-md rounded-xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-stone-600">読み込み中…</p>
      </div>
    ),
  },
);

export function LoginGate() {
  return <LoginParamsBridge />;
}
