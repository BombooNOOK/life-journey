"use client";

import dynamic from "next/dynamic";

import { OwlLoadingPanel } from "@/components/ui/OwlLoadingPanel";

const VerifyClient = dynamic(() => import("./VerifyClient"), {
  ssr: false,
  loading: () => (
    <OwlLoadingPanel layout="section" label="読み込んでいます…" size="sm" className="py-12" />
  ),
});

export default function VerifyShell() {
  return <VerifyClient />;
}
