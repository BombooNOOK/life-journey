"use client";

import Image from "next/image";

import { FirstVisitWizardLink } from "@/components/guide/first-visit/FirstVisitWizardLink";
import type { ChapterCardViewModel } from "@/lib/onboarding/firstVisitWizard/chapterProgress";
import {
  FIRST_VISIT_PATH_GUIDE_ASSETS,
  FIRST_VISIT_PATH_GUIDE_CHAPTER_CARD_SIZE,
  FIRST_VISIT_PATH_GUIDE_IMAGE_SIZES,
} from "@/lib/onboarding/firstVisitWizard/pathGuideAssets";
import {
  pathGuideCardContainerClass,
  pathGuideCardTextClass,
  pathGuideCardTextOverlayClass,
} from "@/lib/onboarding/firstVisitWizard/pathGuideCardText";

type Props = {
  chapter: ChapterCardViewModel;
  onAction?: () => void;
  className?: string;
};

function cardSrc(chapterId: ChapterCardViewModel["id"]): string {
  if (chapterId === 1) return FIRST_VISIT_PATH_GUIDE_ASSETS.cardChapter1;
  if (chapterId === 2) return FIRST_VISIT_PATH_GUIDE_ASSETS.cardChapter2;
  return FIRST_VISIT_PATH_GUIDE_ASSETS.cardChapter3;
}

/** 挿絵入りカード全体を1つの進むボタンとして扱う */
export function FirstVisitIllustratedChapterCard({ chapter, onAction, className = "" }: Props) {
  const clickable = chapter.actionHref != null && chapter.status !== "locked";
  const dimmed = chapter.status === "locked" || chapter.status === "complete";

  const content = (
    <>
      <Image
        src={cardSrc(chapter.id)}
        alt=""
        width={FIRST_VISIT_PATH_GUIDE_CHAPTER_CARD_SIZE.widthPx}
        height={FIRST_VISIT_PATH_GUIDE_CHAPTER_CARD_SIZE.heightPx}
        sizes={FIRST_VISIT_PATH_GUIDE_IMAGE_SIZES}
        className="h-auto w-full"
        priority={chapter.id === 1}
      />

      <div className={pathGuideCardTextOverlayClass}>
        <div className="min-w-0 text-left">
          <p className={`${pathGuideCardTextClass.label} text-emerald-900/75`}>
            {chapter.label}
            {chapter.status === "complete" ? " · 完了" : null}
            {chapter.status === "locked" ? " · ロック" : null}
          </p>
          <h2 className={`${pathGuideCardTextClass.title} text-[#4a3728]`}>
            {chapter.title}
          </h2>
          <p
            className={[
              pathGuideCardTextClass.body,
              dimmed ? "text-[#5c4638]/75" : "text-[#5c4638]/90",
            ].join(" ")}
          >
            {chapter.description}
          </p>
          {chapter.status === "locked" ? (
            <p className={`${pathGuideCardTextClass.meta} text-[#6b5748]/85`}>{chapter.statusLabel}</p>
          ) : null}
          {chapter.status === "available" || chapter.status === "in_progress" ? (
            <p className={`${pathGuideCardTextClass.action} text-emerald-900/85`}>
              {chapter.buttonLabel ?? chapter.statusLabel} →
            </p>
          ) : null}
          {chapter.status === "complete" && chapter.buttonLabel ? (
            <p className={`${pathGuideCardTextClass.action} text-emerald-900/85`}>{chapter.buttonLabel} →</p>
          ) : null}
        </div>
      </div>
    </>
  );

  const shellClass = [
    pathGuideCardContainerClass,
    "transition",
    chapter.status === "locked" ? "opacity-60" : "active:scale-[0.99]",
    clickable ? "cursor-pointer" : "cursor-default",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (clickable && chapter.actionHref) {
    return (
      <FirstVisitWizardLink href={chapter.actionHref} onNavigate={onAction} className={shellClass}>
        {content}
      </FirstVisitWizardLink>
    );
  }

  return (
    <div className={shellClass} aria-disabled={chapter.status === "locked"}>
      {content}
    </div>
  );
}
