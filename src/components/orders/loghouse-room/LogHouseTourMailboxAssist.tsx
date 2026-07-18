"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CharacterFaceIcon } from "@/components/home/CharacterFaceIcon";
import { readLoghouseTourReturnHref, readLoghouseTourStep } from "@/lib/onboarding/firstVisitWizard/loghouseTour";
import {
  LOGHOUSE_TOUR_MAILBOX_PAGE_BANNER,
  LOGHOUSE_TOUR_RETURN_LABEL,
} from "@/lib/onboarding/firstVisitWizard/loghouseTourCopy";

type Props = {
  /** 明示の戻り先（未指定なら案内の returnHref） */
  returnHref?: string;
};

/**
 * はじめて案内中にポスト一覧へ来たときの補足＋戻り導線。
 * session の tour step があるときだけ表示。
 */
export function LogHouseTourMailboxAssist({ returnHref }: Props) {
  const [active, setActive] = useState(false);
  const [href, setHref] = useState(returnHref ?? "/orders");

  useEffect(() => {
    const inTour = Boolean(readLoghouseTourStep());
    setActive(inTour);
    setHref(returnHref ?? readLoghouseTourReturnHref());
  }, [returnHref]);

  if (!active) return null;

  return (
    <div className="space-y-3">
      <section
        aria-label="はじめてのご案内"
        className="rounded-2xl border border-[#e4d5c0]/95 bg-gradient-to-br from-[#fffbf5] via-[#faf6ec] to-[#eef1e4]/90 p-4 shadow-sm ring-1 ring-[#e8dcc8]/80"
      >
        <div className="flex items-start gap-2.5">
          <CharacterFaceIcon name="character-owl-face" />
          <p className="min-w-0 flex-1 whitespace-pre-line text-sm leading-relaxed text-[#5c4a35]">
            {LOGHOUSE_TOUR_MAILBOX_PAGE_BANNER}
          </p>
        </div>
      </section>

      <div className="sticky bottom-3 z-20">
        <Link
          href={href}
          className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-emerald-300/90 bg-[#fffdf9]/95 px-4 py-3 text-sm font-medium text-emerald-950 shadow-lg backdrop-blur-[2px]"
        >
          ← {LOGHOUSE_TOUR_RETURN_LABEL}
        </Link>
      </div>
    </div>
  );
}
