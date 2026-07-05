"use client";

import Image from "next/image";
import { useState } from "react";

import {
  companionWritingGuideBodyClass,
  companionWritingGuidePrimaryButtonClass,
  companionWritingGuideSecondaryButtonClass,
  companionWritingGuideTertiaryButtonClass,
  companionWritingGuideTitleClass,
} from "@/components/journal/companion-writing/companionWritingGuideStyles";
import { FirstVisitGuideCardShell } from "@/components/guide/first-visit/FirstVisitGuideCardShell";
import { ForestDirectionSignBoard } from "@/components/guide/ForestDirectionSignBoard";
import type {
  FirstVisitGuideCard,
  FirstVisitGuideCardAction,
  FirstVisitGuideCardButton,
} from "@/lib/onboarding/firstVisitWizard/cards";

function buttonClassFor(variant: FirstVisitGuideCardButton["variant"]): string {
  if (variant === "secondary") return companionWritingGuideSecondaryButtonClass;
  if (variant === "tertiary") return companionWritingGuideTertiaryButtonClass;
  return companionWritingGuidePrimaryButtonClass;
}

type Props = {
  card: FirstVisitGuideCard;
  onAction: (action: FirstVisitGuideCardAction, cardId: string) => void;
};

function FirstVisitGuideCardIllustration({ src }: { src: string }) {
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  return (
    <div className="mb-4 flex justify-center">
      <Image
        src={src}
        alt=""
        aria-hidden
        width={240}
        height={160}
        sizes="240px"
        className="h-auto max-h-36 w-auto max-w-full select-none object-contain opacity-95"
        onError={() => setHidden(true)}
      />
    </div>
  );
}

/** 1カード1メッセージ・手動送り */
export function FirstVisitGuideCardPanel({ card, onAction }: Props) {
  const hasSign = Boolean(card.signLabel?.trim());
  const signLabel = card.signLabel?.trim() ?? "";

  const cardBody = (
    <FirstVisitGuideCardShell>
      {hasSign ? (
        <ForestDirectionSignBoard label={signLabel} className="mb-4 hidden sm:block" />
      ) : card.illustrationSrc ? (
        <FirstVisitGuideCardIllustration src={card.illustrationSrc} />
      ) : null}
      {!hasSign && card.title ? (
        <p className={companionWritingGuideTitleClass}>{card.title}</p>
      ) : null}
      {card.owlQuote ? (
        <p
          className={`whitespace-pre-line border-l-[3px] border-stone-400 pl-3.5 text-[0.95em] italic leading-relaxed text-stone-600 sm:pl-4 ${
            hasSign || card.title ? "mt-3" : ""
          }`}
        >
          {card.owlQuote}
        </p>
      ) : null}
      {card.body ? (
        <p
          className={`whitespace-pre-line ${hasSign || card.title || card.owlQuote ? "mt-3" : ""} ${card.bodyAlign === "center" ? "text-center" : ""} ${companionWritingGuideBodyClass}`}
        >
          {card.body}
        </p>
      ) : null}
      {card.footnote ? (
        <p className={`mt-3 text-xs leading-relaxed text-stone-500 ${companionWritingGuideBodyClass}`}>
          {card.footnote}
        </p>
      ) : null}
      <div className="mt-5 flex flex-col gap-2.5">
        {card.buttons.map((button) => (
          <button
            key={`${card.id}-${button.label}`}
            type="button"
            className={buttonClassFor(button.variant ?? "primary")}
            onClick={() => onAction(button.action, card.id)}
          >
            {button.label}
          </button>
        ))}
      </div>
    </FirstVisitGuideCardShell>
  );

  if (!hasSign) {
    return cardBody;
  }

  return (
    <div className="flex flex-col gap-3">
      <ForestDirectionSignBoard label={signLabel} className="max-w-none sm:hidden" />
      {cardBody}
    </div>
  );
}

type StackProps = {
  cards: FirstVisitGuideCard[];
  /** 0 始まりの表示中インデックス */
  index: number;
  onAction: (action: FirstVisitGuideCardAction, cardId: string) => void;
};

/** 配列で管理したカードを1枚ずつ表示 */
export function FirstVisitGuideCardStack({ cards, index, onAction }: StackProps) {
  const card = cards[index];
  if (!card) return null;

  return <FirstVisitGuideCardPanel card={card} onAction={onAction} />;
}
