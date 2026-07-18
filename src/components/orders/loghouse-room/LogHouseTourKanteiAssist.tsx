"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { readLoghouseTourReturnHref, readLoghouseTourStep } from "@/lib/onboarding/firstVisitWizard/loghouseTour";
import {
  LOGHOUSE_TOUR_KANTEI_PAGE_BANNER,
  LOGHOUSE_TOUR_RETURN_LABEL,
} from "@/lib/onboarding/firstVisitWizard/loghouseTourCopy";

type Props = {
  returnHref?: string;
};

/** 鑑定書ビューア：はじめて案内中の戻り導線 */
export function LogHouseTourKanteiAssist({ returnHref }: Props) {
  const [active, setActive] = useState(false);
  const [href, setHref] = useState(returnHref ?? "/orders");

  useEffect(() => {
    setActive(Boolean(readLoghouseTourStep()));
    setHref(returnHref ?? readLoghouseTourReturnHref());
  }, [returnHref]);

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto w-full max-w-md space-y-2">
        <div className="rounded-2xl border border-[#e4d5c0]/95 bg-[#fffbf5]/96 px-3.5 py-3 text-left shadow-lg backdrop-blur-[2px]">
          <p className="whitespace-pre-line text-xs leading-relaxed text-[#5c4a35]">
            {LOGHOUSE_TOUR_KANTEI_PAGE_BANNER}
          </p>
        </div>
        <Link
          href={href}
          className="flex min-h-11 w-full items-center justify-center rounded-full border border-[#d9cbb8]/90 bg-[#fffdf8] px-4 text-sm font-medium text-[#5c4a3a] shadow-md"
        >
          ← {LOGHOUSE_TOUR_RETURN_LABEL}
        </Link>
      </div>
    </div>
  );
}
