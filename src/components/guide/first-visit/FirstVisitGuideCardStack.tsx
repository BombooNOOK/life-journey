"use client";

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
import { FIRST_VISIT_LOGHOUSE_SIGN_OWL_FRAME_LABEL_PLACEMENT } from "@/lib/onboarding/firstVisitWizard/loghouseSignLayout";
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

function FirstVisitGuideCardIllustration({
  src,
  large = false,
}: {
  src: string;
  large?: boolean;
}) {
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  return (
    <div className={large ? "mb-5 flex justify-center" : "mb-4 flex justify-center"}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden
        className={
          large
            ? "h-auto max-h-[min(52vw,18rem)] w-auto max-w-full select-none object-contain opacity-98 sm:max-h-80"
            : "h-auto max-h-36 w-auto max-w-full select-none object-contain opacity-95"
        }
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
        <p
          className={`${companionWritingGuideTitleClass}${card.bodyAlign === "center" ? " text-center" : ""}`}
        >
          {card.title}
        </p>
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
  const [illustrationReady, setIllustrationReady] = useState(false);

  if (card.bare && hasOwlComment) {
    const owlPlacement =
      card.id === "loghouse-sign" ? FIRST_VISIT_LOGHOUSE_SIGN_OWL_FRAME_LABEL_PLACEMENT : undefined;

    return (
      <div className="flex w-full flex-col items-center gap-4">
        <OwlCommentFrameBoard
          label={owlCommentLabel}
          placement={owlPlacement}
          className="max-w-none w-full"
          onImageReady={() => setIllustrationReady(true)}
        />
        {illustrationReady ? (
          <div className="w-full space-y-3">
            <GuideCardTextBlocks card={card} hasSign={hasSign} hasOwlComment={hasOwlComment} bare />
            <GuideCardButtons card={card} onAction={onAction} />
          </div>
        ) : null}
      </div>
    );
  }

  if (card.bare && hasSign) {
    return (
      <div className="flex w-full flex-col items-center gap-4">
        <ForestDirectionSignBoard
          label={signLabel}
          multiline={card.signMultiline}
          className="max-w-none w-full"
          onImageReady={() => setIllustrationReady(true)}
        />
        {illustrationReady ? (
          <div className="w-full space-y-3">
            <GuideCardTextBlocks card={card} hasSign={hasSign} hasOwlComment={hasOwlComment} bare />
            <GuideCardButtons card={card} onAction={onAction} />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <FirstVisitGuideCardShell>
      {hasSign ? (
        <ForestDirectionSignBoard label={signLabel} className="mb-4 max-w-none w-full" />
      ) : card.illustrationSrc ? (
        <FirstVisitGuideCardIllustration src={card.illustrationSrc} large={card.illustrationLarge} />
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
