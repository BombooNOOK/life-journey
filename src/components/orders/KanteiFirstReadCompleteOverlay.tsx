"use client";

import { useRouter } from "next/navigation";

import { FirstVisitGuideCardShell } from "@/components/guide/first-visit/FirstVisitGuideCardShell";
import { BodyPortal } from "@/components/ui/BodyPortal";
import {
  companionWritingGuideBodyClass,
  companionWritingGuidePrimaryButtonClass,
  companionWritingGuideSecondaryButtonClass,
  companionWritingGuideTitleClass,
} from "@/components/journal/companion-writing/companionWritingGuideStyles";
import {
  KANTEI_FIRST_READ_COMPLETE_OVERLAY_BODY,
  KANTEI_FIRST_READ_COMPLETE_OVERLAY_OWL_QUOTE,
  KANTEI_FIRST_READ_COMPLETE_OVERLAY_PRIMARY_BUTTON,
  KANTEI_FIRST_READ_COMPLETE_OVERLAY_SECONDARY_BUTTON,
} from "@/lib/onboarding/bookshelfKanteiGuideCopy";
import { calendarDayKeyInJapan, journalWithCompanionPath } from "@/lib/journal/journalNav";
import { clearBookshelfKanteiGuideFlag } from "@/lib/onboarding/firstVisitWizard/session";
import { markKanteiFirstReadComplete } from "@/lib/pdf/kanteiFirstReadGuide";

const OVERLAY_Z_CLASS = "z-[240]" as const;

type Props = {
  open: boolean;
  orderId: string;
  activeProfileId?: string;
  backHref?: string;
  onClose: () => void;
};

/** 鑑定書初回ガイド：ライフパス章の終わり */
export function KanteiFirstReadCompleteOverlay({
  open,
  orderId,
  activeProfileId,
  backHref = "/orders/bookshelf",
  onClose,
}: Props) {
  const router = useRouter();

  if (!open) return null;

  const finish = () => {
    markKanteiFirstReadComplete(orderId);
    clearBookshelfKanteiGuideFlag();
    onClose();
  };

  const handleJournal = () => {
    finish();
    if (!activeProfileId) {
      router.push(backHref);
      return;
    }
    router.push(
      journalWithCompanionPath(backHref, activeProfileId, calendarDayKeyInJapan(new Date())),
    );
  };

  const handleStay = () => {
    finish();
    router.push(backHref);
  };

  return (
    <BodyPortal>
      <div
        className={`fixed inset-0 ${OVERLAY_Z_CLASS} flex items-center justify-center overflow-y-auto px-4 py-10`}
        role="dialog"
        aria-modal="true"
        aria-label="鑑定書のご案内"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-stone-900/35 backdrop-blur-[1px]"
          aria-hidden
        />
        <div className="relative z-10 my-auto w-full max-w-sm">
          <FirstVisitGuideCardShell>
            <p className={`m-0 text-center ${companionWritingGuideTitleClass}`}>
              ライフパスを読み終えました
            </p>
            <blockquote className="mt-4 border-l-2 border-emerald-700/40 pl-3 text-left text-sm leading-relaxed text-emerald-950">
              {KANTEI_FIRST_READ_COMPLETE_OVERLAY_OWL_QUOTE}
            </blockquote>
            <p
              className={`m-0 mt-3 whitespace-pre-line text-left ${companionWritingGuideBodyClass} text-stone-700`}
            >
              {KANTEI_FIRST_READ_COMPLETE_OVERLAY_BODY}
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <button type="button" className={companionWritingGuidePrimaryButtonClass} onClick={handleJournal}>
                {KANTEI_FIRST_READ_COMPLETE_OVERLAY_PRIMARY_BUTTON}
              </button>
              <button type="button" className={companionWritingGuideSecondaryButtonClass} onClick={handleStay}>
                {KANTEI_FIRST_READ_COMPLETE_OVERLAY_SECONDARY_BUTTON}
              </button>
            </div>
          </FirstVisitGuideCardShell>
        </div>
      </div>
    </BodyPortal>
  );
}
