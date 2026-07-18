"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { readLoghouseTourReturnHref, readLoghouseTourStep } from "@/lib/onboarding/firstVisitWizard/loghouseTour";
import { LOGHOUSE_TOUR_RETURN_LABEL } from "@/lib/onboarding/firstVisitWizard/loghouseTourCopy";

type Props = {
  /** 通常時の戻り先（案内中は session の returnHref を優先） */
  href?: string;
  /** 通常時のラベル（← 付きでも可） */
  fallbackLabel: string;
  className?: string;
};

/** はじめて案内中なら「案内に戻る」ラベルに切り替える戻るリンク */
export function LogHouseTourAwareBackLink({
  href = "/orders",
  fallbackLabel,
  className,
}: Props) {
  const [label, setLabel] = useState(fallbackLabel);
  const [resolvedHref, setResolvedHref] = useState(href);

  useEffect(() => {
    if (readLoghouseTourStep()) {
      setLabel(`← ${LOGHOUSE_TOUR_RETURN_LABEL}`);
      setResolvedHref(readLoghouseTourReturnHref());
      return;
    }
    setLabel(fallbackLabel);
    setResolvedHref(href);
  }, [fallbackLabel, href]);

  return (
    <Link href={resolvedHref} className={className}>
      {label}
    </Link>
  );
}
