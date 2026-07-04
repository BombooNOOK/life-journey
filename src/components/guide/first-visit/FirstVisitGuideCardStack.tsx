"use client";

import {
  companionWritingGuideBodyClass,
  companionWritingGuidePrimaryButtonClass,
  companionWritingGuideSecondaryButtonClass,
  companionWritingGuideTertiaryButtonClass,
  companionWritingGuideTitleClass,
} from "@/components/journal/companion-writing/companionWritingGuideStyles";
import { FirstVisitGuideCardShell } from "@/components/guide/first-visit/FirstVisitGuideCardShell";
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

/** 1カード1メッセージ・手動送り */
export function FirstVisitGuideCardPanel({ card, onAction }: Props) {
  return (
    <FirstVisitGuideCardShell>
      {card.title ? <p className={companionWritingGuideTitleClass}>{card.title}</p> : null}
      <p className={`whitespace-pre-line ${card.title ? "mt-2" : ""} ${companionWritingGuideBodyClass}`}>
        {card.body}
      </p>
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
