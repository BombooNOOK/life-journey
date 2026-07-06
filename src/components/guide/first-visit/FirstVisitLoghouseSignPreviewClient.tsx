"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { FirstVisitGuideCardPageLayout } from "@/components/guide/first-visit/FirstVisitGuideCardPageLayout";
import { FirstVisitGuideCardPanel } from "@/components/guide/first-visit/FirstVisitGuideCardStack";
import type { FirstVisitGuideCardAction } from "@/lib/onboarding/firstVisitWizard/cards";
import { FIRST_VISIT_LOGHOUSE_SIGN_CARD } from "@/lib/onboarding/firstVisitWizard/cards";

export function FirstVisitLoghouseSignPreviewClient() {
  const router = useRouter();

  const handleAction = useCallback(
    (action: FirstVisitGuideCardAction, cardId: string) => {
      if (action !== "next" || cardId !== "loghouse-sign") return;
      router.push("/guide/first/loghouse");
    },
    [router],
  );

  return (
    <div>
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs leading-relaxed text-amber-950">
        プレビュー（サンプル）。次へを押すと本番の{" "}
        <code className="rounded bg-amber-100 px-1">/guide/first/loghouse</code>{" "}
        へ移動します（ログインが必要な場合があります）。
      </div>
      <FirstVisitGuideCardPageLayout stepLabel="ログハウスへ" ariaLabel="ログハウス建築の案内">
        <FirstVisitGuideCardPanel card={FIRST_VISIT_LOGHOUSE_SIGN_CARD} onAction={handleAction} />
      </FirstVisitGuideCardPageLayout>
    </div>
  );
}
