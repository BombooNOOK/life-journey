import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DailyFortunePreviewClient } from "@/components/orders/daily-fortune/DailyFortunePreviewClient";
import { assertDevOrAdminPreviewAccess } from "@/lib/preview/assertDevOrAdminPreviewAccess";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "プレビュー：今日の鑑定結果",
};

export default async function DailyFortunePreviewPage() {
  try {
    await assertDevOrAdminPreviewAccess();
  } catch {
    redirect("/");
  }

  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-[#ebe4d4]" />}>
      <DailyFortunePreviewClient />
    </Suspense>
  );
}
