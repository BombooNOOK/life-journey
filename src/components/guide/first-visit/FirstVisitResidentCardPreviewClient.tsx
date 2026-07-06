"use client";

import { useRouter } from "next/navigation";

import { FirstVisitResidentCardContent } from "@/components/guide/first-visit/FirstVisitResidentCardContent";
import { FIRST_VISIT_RESIDENT_CARD_PREVIEW_FIXTURE } from "@/lib/onboarding/firstVisitWizard/residentCardPreviewFixture";

export function FirstVisitResidentCardPreviewClient() {
  const router = useRouter();

  return (
    <div>
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs leading-relaxed text-amber-950">
        プレビュー（サンプルデータ）。本番の導線は{" "}
        <code className="rounded bg-amber-100 px-1">/guide/first/resident-card</code>{" "}
        です。既存アカウントでログインすれば新規登録なしで確認できます。
      </div>
      <FirstVisitResidentCardContent
        card={FIRST_VISIT_RESIDENT_CARD_PREVIEW_FIXTURE}
        showEmailNote
        onNext={() => router.push("/preview/first-visit/loghouse-sign")}
      />
    </div>
  );
}
