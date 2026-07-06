"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { FirstVisitGuideStage } from "@/components/guide/first-visit/FirstVisitGuideStage";
import { FirstVisitGuideCardStack } from "@/components/guide/first-visit/FirstVisitGuideCardStack";
import {
  BOOKSHELF_KANTEI_COMPLETE_GUIDE_CARDS,
  type FirstVisitGuideCardAction,
} from "@/lib/onboarding/firstVisitWizard/cards";
import {
  clearBookshelfKanteiGuideFlag,
  readBookshelfKanteiGuideFlag,
} from "@/lib/onboarding/firstVisitWizard/session";
import { calendarDayKeyInJapan, journalWithCompanionPath } from "@/lib/journal/journalNav";

type Props = {
  activeProfileId: string;
};

/** 鑑定完了直後：本棚に鑑定書が並んだあと、2枚の案内カード */
export function BookshelfKanteiCompleteGuide({ activeProfileId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setOpen(readBookshelfKanteiGuideFlag());
  }, []);

  const finishGuide = useCallback(() => {
    clearBookshelfKanteiGuideFlag();
    setOpen(false);
  }, []);

  const handleAction = useCallback(
    (action: FirstVisitGuideCardAction, cardId: string) => {
      if (action === "next" && cardId === BOOKSHELF_KANTEI_COMPLETE_GUIDE_CARDS[0]?.id) {
        setIndex(1);
        return;
      }

      finishGuide();

      if (action === "companion_journal") {
        const href = journalWithCompanionPath(
          "/orders/bookshelf",
          activeProfileId,
          calendarDayKeyInJapan(new Date()),
        );
        router.push(href);
        return;
      }

      if (typeof window !== "undefined" && window.location.hash) {
        const target = document.getElementById("bookshelf-kantei-books");
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [activeProfileId, finishGuide, router],
  );

  if (!open) return null;

  const card = BOOKSHELF_KANTEI_COMPLETE_GUIDE_CARDS[index];
  if (!card) return null;

  return (
    <FirstVisitGuideStage ariaLabel={card.title ?? "鑑定書のご案内"}>
      <FirstVisitGuideCardStack
        cards={BOOKSHELF_KANTEI_COMPLETE_GUIDE_CARDS}
        index={index}
        onAction={handleAction}
      />
    </FirstVisitGuideStage>
  );
}
