"use client";

import { useEffect, useState } from "react";

import { OwlNavButton } from "@/components/ui/OwlNavButton";
import { LOG_HOUSE_LOADING_LABEL } from "@/lib/journal/logHouseLabels";
import {
  readLoghouseTourReturnHref,
  readLoghouseTourStep,
} from "@/lib/onboarding/firstVisitWizard/loghouseTour";
import { LOGHOUSE_TOUR_RETURN_LABEL } from "@/lib/onboarding/firstVisitWizard/loghouseTourCopy";

type Props = {
  /** 通常時の戻り先（案内中は session の returnHref を優先） */
  href?: string;
  /** 通常時のラベル（← 付きでも可） */
  fallbackLabel: string;
  className?: string;
};

const TOUR_RETURN_LOADING_LABEL = "案内に戻っています…" as const;

/** はじめて案内中なら「案内に戻る」ラベルに切り替える戻るリンク（遷移中はくるくるフクロウ） */
export function LogHouseTourAwareBackLink({
  href = "/orders",
  fallbackLabel,
  className,
}: Props) {
  const [label, setLabel] = useState(fallbackLabel);
  const [resolvedHref, setResolvedHref] = useState(href);
  const [loadingLabel, setLoadingLabel] = useState(LOG_HOUSE_LOADING_LABEL);

  useEffect(() => {
    if (readLoghouseTourStep()) {
      setLabel(`← ${LOGHOUSE_TOUR_RETURN_LABEL}`);
      setResolvedHref(readLoghouseTourReturnHref());
      setLoadingLabel(TOUR_RETURN_LOADING_LABEL);
      return;
    }
    setLabel(fallbackLabel);
    setResolvedHref(href);
    setLoadingLabel(LOG_HOUSE_LOADING_LABEL);
  }, [fallbackLabel, href]);

  return (
    <OwlNavButton href={resolvedHref} loadingLabel={loadingLabel} className={className}>
      {label}
    </OwlNavButton>
  );
}
