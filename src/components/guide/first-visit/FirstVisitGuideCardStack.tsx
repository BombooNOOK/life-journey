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
import { OwlCommentFrameBoard } from "@/components/guide/OwlCommentFrameBoard";
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

function GuideCardButtons({
  card,
  onAction,
}: {
  card: FirstVisitGuideCard;
  onAction: (action: FirstVisitGuideCardAction, cardId: string) => void;
}) {
  return (
    <div className="flex w-full flex-col gap-2.5">
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
  );
}

function GuideCardTextBlocks({
  card,
  hasSign,
  hasOwlComment,
  bare = false,
}: {
  card: FirstVisitGuideCard;
  hasSign: boolean;
  hasOwlComment?: boolean;
  bare?: boolean;
}) {
  const bodyClass = bare
    ? "text-base leading-relaxed text-stone-700"
    : companionWritingGuideBodyClass;

  return (
    <>
      {!hasSign && !hasOwlComment && card.title ? (
        <p className={companionWritingGuideTitleClass}>{card.title}</p>
      ) : null}
      {!hasOwlComment && card.owlQuote ? (
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
          className={`whitespace-pre-line ${hasSign || hasOwlComment || card.title || card.owlQuote ? "mt-3" : ""} ${card.bodyAlign === "center" ? "text-center" : ""} ${bodyClass}`}
        >
          {card.body}
        </p>
      ) : null}
      {card.footnote ? (
        <p
          className={`${hasOwlComment ? "text-center text-xs leading-relaxed text-stone-500" : `mt-3 text-xs leading-relaxed text-stone-500 ${bodyClass}`}`}
        >
          {card.footnote}
        </p>
      ) : null}
    </>
  );
}

/** 1カード1メッセージ・手動送り */
export function FirstVisitGuideCardPanel({ card, onAction }: Props) {
  const hasSign = Boolean(card.signLabel?.trim());
  const signLabel = card.signLabel?.trim() ?? "";
  const hasOwlComment = Boolean(card.owlCommentLabel?.trim());
  const owlCommentLabel = card.owlCommentLabel?.trim() ?? "";

  if (card.bare && hasOwlComment) {
    return (
      <div className="flex w-full flex-col items-center gap-4">
        <OwlCommentFrameBoard label={owlCommentLabel} className="max-w-none w-full" />
        <div className="w-full space-y-3">
          <GuideCardTextBlocks card={card} hasSign={hasSign} hasOwlComment={hasOwlComment} bare />
          <GuideCardButtons card={card} onAction={onAction} />
        </div>
      </div>
    );
  }

  if (card.bare && hasSign) {
    return (
      <div className="flex w-full flex-col items-center gap-4">
        <ForestDirectionSignBoard label={signLabel} className="max-w-none w-full" />
        <div className="w-full space-y-3">
          <GuideCardTextBlocks card={card} hasSign={hasSign} hasOwlComment={hasOwlComment} bare />
          <GuideCardButtons card={card} onAction={onAction} />
        </div>
      </div>
    );
  }

  return (
    <FirstVisitGuideCardShell>
      {hasSign ? (
        <ForestDirectionSignBoard label={signLabel} className="mb-4 max-w-none w-full" />
      ) : card.illustrationSrc ? (
        <FirstVisitGuideCardIllustration src={card.illustrationSrc} />
      ) : null}
      <GuideCardTextBlocks card={card} hasSign={hasSign} hasOwlComment={hasOwlComment} />
      <div className="mt-5">
        <GuideCardButtons card={card} onAction={onAction} />
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
