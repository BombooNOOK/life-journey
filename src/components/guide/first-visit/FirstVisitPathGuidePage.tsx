"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { FirstVisitIllustratedChapterCard } from "@/components/guide/first-visit/FirstVisitIllustratedChapterCard";
import { FirstVisitPathGuidePrologueCard } from "@/components/guide/first-visit/FirstVisitPathGuidePrologueCard";
import { useTransitionNavigation } from "@/components/ui/TransitionNavigationProvider";
import {
  resolveFirstVisitChapterCards,
  type ChapterCardViewModel,
  type ChapterProgressInput,
} from "@/lib/onboarding/firstVisitWizard/chapterProgress";
import {
  FIRST_VISIT_PATH_GUIDE_ASSETS,
  FIRST_VISIT_PATH_GUIDE_CONTENT_MAX_WIDTH_PX,
  FIRST_VISIT_PATH_GUIDE_IMAGE_SIZES,
  FIRST_VISIT_PATH_GUIDE_TITLE_SIGN_SIZE,
  pathGuideAspectRatio,
} from "@/lib/onboarding/firstVisitWizard/pathGuideAssets";
import {
  pathGuideTitleSignTextClass,
} from "@/lib/onboarding/firstVisitWizard/pathGuideCardText";
import {
  FIRST_VISIT_PATH_GUIDE_BACK_LABEL,
  FIRST_VISIT_PATH_GUIDE_TITLE,
} from "@/lib/onboarding/firstVisitWizard/pathGuideCopy";
import { readFirstVisitProgressStage } from "@/lib/onboarding/firstVisitWizard/progress";
import {
  readBookshelfKanteiGuideFlag,
  readFirstVisitChapter3StartedFlag,
  readFirstVisitChapterCompleteFlag,
  readFirstVisitFromRegisterFlag,
  readFirstVisitOrderGuideFlag,
  readFirstVisitPathGuidePrologueWatchedFlag,
  setFirstVisitChapter3StartedFlag,
  setFirstVisitPathGuidePrologueWatchedFlag,
} from "@/lib/onboarding/firstVisitWizard/session";
import type { FirstVisitReadyBranch, FirstVisitReadyContext } from "@/lib/viewer/firstVisitReadyContext";

const CONTEXT_FETCH_TIMEOUT_MS = 8000;
/** プロローグ＋章カード間。看板下・下部ボタン上の余白と揃える */
const CARD_STACK_CLASS = "mt-5 flex flex-1 flex-col gap-2.5 lg:mt-6 lg:gap-3";

/** SSR / 初回 hydrate 共通の安全な初期値（sessionStorage を読まない） */
const BOOTSTRAP_INPUT: ChapterProgressInput = {
  branch: "guest",
  journalEntryCount: 0,
  savedStage: null,
  chapter1CompleteFlag: false,
  chapter2CompleteFlag: false,
  chapter3CompleteFlag: false,
  chapter3StartedFlag: false,
  bookshelfKanteiGuide: false,
  orderGuide: false,
  fromRegisterHandoff: false,
};

function buildProgressInput(
  branch: FirstVisitReadyBranch,
  journalEntryCount: number,
): ChapterProgressInput {
  return {
    branch,
    journalEntryCount,
    savedStage: readFirstVisitProgressStage(),
    chapter1CompleteFlag: readFirstVisitChapterCompleteFlag(1),
    chapter2CompleteFlag: readFirstVisitChapterCompleteFlag(2),
    chapter3CompleteFlag: readFirstVisitChapterCompleteFlag(3),
    chapter3StartedFlag: readFirstVisitChapter3StartedFlag(),
    bookshelfKanteiGuide: readBookshelfKanteiGuideFlag(),
    orderGuide: readFirstVisitOrderGuideFlag(),
    fromRegisterHandoff: readFirstVisitFromRegisterFlag(),
  };
}

function resolveView(branch: FirstVisitReadyBranch, journalEntryCount: number) {
  const input = buildProgressInput(branch, journalEntryCount);
  return resolveFirstVisitChapterCards(input);
}

/** はじめての道しるべ — 幅基準・縦横比固定（イラストは伸ばさない） */
export function FirstVisitPathGuidePage() {
  const { replace, isPending } = useTransitionNavigation();
  const [chapters, setChapters] = useState<ChapterCardViewModel[]>(() =>
    resolveFirstVisitChapterCards(BOOTSTRAP_INPUT),
  );
  const [prologueWatched, setPrologueWatched] = useState(false);

  const syncFromSession = useCallback((branch: FirstVisitReadyBranch, journalEntryCount: number) => {
    setChapters(resolveView(branch, journalEntryCount));
  }, []);

  useEffect(() => {
    setPrologueWatched(readFirstVisitPathGuidePrologueWatchedFlag());
    syncFromSession("guest", 0);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), CONTEXT_FETCH_TIMEOUT_MS);

    void fetch("/api/viewer/first-visit-ready-context", { credentials: "same-origin" })
      .then(async (res) => {
        if (!res.ok) throw new Error("context fetch failed");
        return (await res.json()) as FirstVisitReadyContext;
      })
      .then((data) => {
        syncFromSession(data.branch, data.journalEntryCount ?? 0);
      })
      .catch(() => {
        // ゲスト表示のまま
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
      });

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [syncFromSession]);

  const handlePrologueWatched = useCallback(() => {
    setFirstVisitPathGuidePrologueWatchedFlag();
    setPrologueWatched(true);
  }, []);

  const handleChapter3Start = useCallback(() => {
    setFirstVisitChapter3StartedFlag();
  }, []);

  return (
    <div className="home-read-scope relative min-h-[100dvh] bg-white">
      <div
        className="relative z-10 mx-auto flex min-h-[100dvh] w-full flex-col px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-[max(0.35rem,env(safe-area-inset-top))]"
        style={{ maxWidth: FIRST_VISIT_PATH_GUIDE_CONTENT_MAX_WIDTH_PX }}
      >
        {/* 看板：幅いっぱい・高さは素材の縦横比 */}
        <header
          className="@container relative w-full shrink-0"
          style={{ aspectRatio: pathGuideAspectRatio(FIRST_VISIT_PATH_GUIDE_TITLE_SIGN_SIZE) }}
        >
          <Image
            src={FIRST_VISIT_PATH_GUIDE_ASSETS.titleSign}
            alt=""
            fill
            className="object-contain object-center"
            sizes={FIRST_VISIT_PATH_GUIDE_IMAGE_SIZES}
            priority
          />
          <div className="absolute inset-[24%_16%_24%_16%] flex items-center justify-center text-center">
            <h1 className={`${pathGuideTitleSignTextClass.heading} text-[#4a3728]`}>
              {FIRST_VISIT_PATH_GUIDE_TITLE}
            </h1>
          </div>
        </header>

        {/* カード4枚：看板下・カード間・下部ボタンまで均等に余白 */}
        <div className={CARD_STACK_CLASS}>
          <FirstVisitPathGuidePrologueCard watched={prologueWatched} onWatched={handlePrologueWatched} />

          {chapters.map((chapter) => (
            <FirstVisitIllustratedChapterCard
              key={chapter.id}
              chapter={chapter}
              onAction={
                chapter.id === 3 && chapter.status !== "complete" ? handleChapter3Start : undefined
              }
            />
          ))}
        </div>

        {/* 下部ナビ：章カードタップで進むため、森の入口へのみ */}
        <div className="mt-6 w-full shrink-0 pb-1 lg:mt-8">
          <button
            type="button"
            disabled={isPending}
            onClick={() => replace("/")}
            className="inline-flex min-h-[40px] w-full items-center justify-center rounded-full bg-[#8a7a68] px-2.5 text-[1.125rem] font-medium text-white shadow-sm transition hover:bg-[#7a6b5a] disabled:opacity-60 lg:text-[0.84rem]"
          >
            {FIRST_VISIT_PATH_GUIDE_BACK_LABEL}
          </button>
        </div>
      </div>
    </div>
  );
}
