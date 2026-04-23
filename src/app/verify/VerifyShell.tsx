"use client";

import dynamic from "next/dynamic";

const VerifyClient = dynamic(() => import("./VerifyClient"), {
  ssr: false,
  loading: () => (
    <p className="py-12 text-center text-sm text-stone-500">読み込み中…</p>
  ),
});

export default function VerifyShell() {
  return <VerifyClient />;
}
