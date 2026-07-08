"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { OwlLoadingPanel } from "@/components/ui/OwlLoadingPanel";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";
import { readFirstVisitOrderGuideFlag } from "@/lib/onboarding/firstVisitWizard/session";

type Props = {
  children: ReactNode;
};

/**
 * 初回導線（kantei-ready）を経ずに /order へ来たログイン済みユーザーを戻す。
 * ?profile= 付きは既存会員の追加プロフィール用として通す。
 */
export function OrderPageFirstVisitGate({ children }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profileId = searchParams.get("profile")?.trim() ?? "";
  const [allowed, setAllowed] = useState(() => profileId.length > 0 || readFirstVisitOrderGuideFlag());

  useEffect(() => {
    if (profileId.length > 0 || readFirstVisitOrderGuideFlag()) {
      setAllowed(true);
      return;
    }
    router.replace(FIRST_VISIT_ROUTES.kanteiReady);
  }, [profileId, router]);

  if (!allowed) {
    return (
      <OwlLoadingPanel
        layout="page"
        label="案内へ戻しています…"
        hint="初回の方は、鑑定のへやへの案内から進んでください。"
      />
    );
  }

  return children;
}
