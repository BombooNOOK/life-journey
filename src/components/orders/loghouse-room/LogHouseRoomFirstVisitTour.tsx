"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { CharacterFaceIcon } from "@/components/home/CharacterFaceIcon";
import {
  companionWritingFloatingGuideClass,
  companionWritingGuideBodyClass,
  companionWritingGuidePrimaryButtonClass,
  companionWritingGuideSecondaryButtonClass,
} from "@/components/journal/companion-writing/companionWritingGuideStyles";
import { buildForestGuideStationHref } from "@/lib/help/forestGuideStationNav";
import type { LoghouseTourStepId } from "@/lib/onboarding/firstVisitWizard/loghouseTour";
import {
  LOGHOUSE_TOUR_A11Y_LABEL,
  LOGHOUSE_TOUR_AWAITING_DESK_OWL_QUOTE,
  LOGHOUSE_TOUR_BOOKSHELF_GUIDE_HASH,
  LOGHOUSE_TOUR_BOOKSHELF_GUIDE_LINK_LABEL,
  LOGHOUSE_TOUR_BOOKSHELF_LATER,
  LOGHOUSE_TOUR_BOOKSHELF_OPEN_NOW,
  LOGHOUSE_TOUR_BOOKSHELF_OWL_QUOTE,
  LOGHOUSE_TOUR_DESK_NEXT,
  LOGHOUSE_TOUR_DESK_OWL_QUOTE,
  LOGHOUSE_TOUR_HINT_NEXT,
  LOGHOUSE_TOUR_HINT_OWL_QUOTE,
  LOGHOUSE_TOUR_INVITE_CTA,
  LOGHOUSE_TOUR_INVITE_OWL_QUOTE,
  LOGHOUSE_TOUR_MAILBOX_OPEN,
  LOGHOUSE_TOUR_MAILBOX_OWL_QUOTE,
  LOGHOUSE_TOUR_WRAP_UP_NEXT,
  LOGHOUSE_TOUR_WRAP_UP_OWL_QUOTE,
} from "@/lib/onboarding/firstVisitWizard/loghouseTourCopy";

type Props = {
  step: LoghouseTourStepId;
  /** inviteWrite で机ハイライト待ち */
  awaitingDeskTap?: boolean;
  /** 案内所から戻る先（本番=/orders、プレビュー用パス） */
  guideReturnTo?: string;
  /** ポストなど下側を隠さないよう、案内カードを上に置く */
  cardPlacement?: "top" | "bottom";
  onNext: () => void;
  onOpenMailbox: () => void;
  onOpenBookshelf: () => void;
  onGoToDesk: () => void;
};

function OwlCard({
  quote,
  children,
}: {
  quote: string;
  children?: ReactNode;
}) {
  return (
    <section
      aria-label={LOGHOUSE_TOUR_A11Y_LABEL}
      className={`${companionWritingFloatingGuideClass} pointer-events-auto max-w-sm`}
    >
      <div className="flex items-start gap-2.5">
        <CharacterFaceIcon name="character-owl-face" />
        <p className={`min-w-0 flex-1 whitespace-pre-line ${companionWritingGuideBodyClass} mt-0`}>
          {quote}
        </p>
      </div>
      {children ? <div className="mt-4 space-y-2">{children}</div> : null}
    </section>
  );
}

/** ログハウス室内：はじめて案内カード（生成り・フクロウ先生） */
export function LogHouseRoomFirstVisitTour({
  step,
  awaitingDeskTap = false,
  guideReturnTo = "/orders",
  cardPlacement = "bottom",
  onNext,
  onOpenMailbox,
  onOpenBookshelf,
  onGoToDesk,
}: Props) {
  const cardShellClass =
    cardPlacement === "top"
      ? "pointer-events-none absolute inset-x-0 top-[4.75rem] z-[58] flex justify-center px-4"
      : "pointer-events-none absolute inset-x-0 bottom-6 z-[58] flex justify-center px-4 pb-[env(safe-area-inset-bottom)]";

  if (awaitingDeskTap) {
    return (
      <div className={cardShellClass}>
        <OwlCard quote={LOGHOUSE_TOUR_AWAITING_DESK_OWL_QUOTE} />
      </div>
    );
  }

  let body: ReactNode = null;
  const guideHref = buildForestGuideStationHref({
    returnTo: guideReturnTo,
    hash: LOGHOUSE_TOUR_BOOKSHELF_GUIDE_HASH,
  });

  if (step === "desk") {
    body = (
      <OwlCard quote={LOGHOUSE_TOUR_DESK_OWL_QUOTE}>
        <button type="button" className={companionWritingGuidePrimaryButtonClass} onClick={onNext}>
          {LOGHOUSE_TOUR_DESK_NEXT}
        </button>
      </OwlCard>
    );
  } else if (step === "mailbox") {
    body = (
      <OwlCard quote={LOGHOUSE_TOUR_MAILBOX_OWL_QUOTE}>
        <button
          type="button"
          className={companionWritingGuidePrimaryButtonClass}
          onClick={onOpenMailbox}
        >
          {LOGHOUSE_TOUR_MAILBOX_OPEN}
        </button>
      </OwlCard>
    );
  } else if (step === "bookshelf") {
    body = (
      <OwlCard quote={LOGHOUSE_TOUR_BOOKSHELF_OWL_QUOTE}>
        <Link
          href={guideHref}
          className="block text-center text-sm font-medium text-emerald-900 underline-offset-2 hover:underline"
        >
          {LOGHOUSE_TOUR_BOOKSHELF_GUIDE_LINK_LABEL}
        </Link>
        <button
          type="button"
          className={companionWritingGuidePrimaryButtonClass}
          onClick={onOpenBookshelf}
        >
          {LOGHOUSE_TOUR_BOOKSHELF_OPEN_NOW}
        </button>
        <button
          type="button"
          className={companionWritingGuideSecondaryButtonClass}
          onClick={onNext}
        >
          {LOGHOUSE_TOUR_BOOKSHELF_LATER}
        </button>
      </OwlCard>
    );
  } else if (step === "hint") {
    body = (
      <OwlCard quote={LOGHOUSE_TOUR_HINT_OWL_QUOTE}>
        <button type="button" className={companionWritingGuidePrimaryButtonClass} onClick={onNext}>
          {LOGHOUSE_TOUR_HINT_NEXT}
        </button>
      </OwlCard>
    );
  } else if (step === "wrapUp") {
    body = (
      <OwlCard quote={LOGHOUSE_TOUR_WRAP_UP_OWL_QUOTE}>
        <button type="button" className={companionWritingGuidePrimaryButtonClass} onClick={onNext}>
          {LOGHOUSE_TOUR_WRAP_UP_NEXT}
        </button>
      </OwlCard>
    );
  } else {
    body = (
      <OwlCard quote={LOGHOUSE_TOUR_INVITE_OWL_QUOTE}>
        <button
          type="button"
          className={companionWritingGuidePrimaryButtonClass}
          onClick={onGoToDesk}
        >
          {LOGHOUSE_TOUR_INVITE_CTA}
        </button>
      </OwlCard>
    );
  }

  return <div className={cardShellClass}>{body}</div>;
}
