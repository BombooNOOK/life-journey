"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CharacterFaceIcon } from "@/components/home/CharacterFaceIcon";
import {
  companionWritingFloatingGuideClass,
  companionWritingGuideBodyClass,
  companionWritingGuidePrimaryButtonClass,
} from "@/components/journal/companion-writing/companionWritingGuideStyles";
import { DiaryBookCreateForm } from "@/components/orders/DiaryBookCreateForm";
import {
  ForestBookshelfItem,
  ForestBookshelfTapSpot,
} from "@/components/orders/forest-bookshelf/ForestBookshelfParts";
import {
  ForestBookshelfListPanel,
  type ForestBookshelfListItem,
} from "@/components/orders/forest-bookshelf/ForestBookshelfListPanel";
import {
  ForestBookshelfPeekCard,
  type ForestBookshelfPeekCardModel,
} from "@/components/orders/forest-bookshelf/ForestBookshelfPeekCard";
import { ForestBookshelfHelp } from "@/components/orders/forest-bookshelf/ForestBookshelfHelp";
import { LogHouseTourAwareBackLink } from "@/components/orders/loghouse-room/LogHouseTourAwareBackLink";
import { TrialStatusBanner } from "@/components/entitlement/TrialStatusBanner";
import { KanteiMissingBanner } from "@/components/orders/KanteiMissingBanner";
import { FirstVisitFlowBrowserBackGuard } from "@/components/orders/FirstVisitFlowBrowserBackGuard";
import type { SerializedUserEntitlement } from "@/lib/entitlement/resolveUserEntitlement";
import {
  readLoghouseTourReturnHref,
  readLoghouseTourStep,
} from "@/lib/onboarding/firstVisitWizard/loghouseTour";
import {
  LOGHOUSE_TOUR_KANTEI_PREVIEW_PEEK,
  LOGHOUSE_TOUR_RETURN_LABEL,
} from "@/lib/onboarding/firstVisitWizard/loghouseTourCopy";
import {
  FOREST_BOOKSHELF_ASSETS,
  FOREST_BOOKSHELF_INTRINSIC,
  FOREST_BOOKSHELF_PAGE_BG,
} from "@/lib/ljd/forestBookshelfAssets";
import {
  markForestBookshelfSpotGuideSeen,
  owlQuoteForBookshelfGuide,
  resolveForestBookshelfSpotGuide,
  spotIdForBookshelfGuide,
  type ForestBookshelfSpotGuideKind,
} from "@/lib/ljd/forestBookshelfFirstVisitGuide";
import {
  FOREST_BOOKSHELF_ITEM_LAYOUT,
  FOREST_BOOKSHELF_SPOT_LAYOUT,
  type ForestBookshelfItemId,
  type ForestBookshelfRect,
  type ForestBookshelfSpotId,
} from "@/lib/ljd/forestBookshelfLayout";
import { LOG_HOUSE_BACK_TO_LINK_LABEL } from "@/lib/journal/logHouseLabels";
import { LJD_PAPER_LINK_CLASS } from "@/lib/ljd/ljdPaperSurface";
import { readDiaryBookCreateDraft } from "@/lib/journal/diaryBookCreateDraft";

export type ForestBookshelfKanteiItem = {
  id: string;
  title: string;
  createdLabel: string;
  subtitle: string;
  href: string;
  coverSrc: string;
};

export type ForestBookshelfDiaryItem = {
  id: string;
  title: string;
  periodLabel: string;
  createdLabel: string;
  entryCount: number;
  href: string;
  coverSrc: string;
};

type Props = {
  activeProfileLabel: string;
  activeProfileId: string;
  entitlement: SerializedUserEntitlement;
  kanteiBooks: ForestBookshelfKanteiItem[];
  diaryBooks: ForestBookshelfDiaryItem[];
  blockCreate: boolean;
  deployRevision?: string | null;
  /** immersive = 本番スマホ全画面 / framed = 定規埋め込みなど */
  layout?: "immersive" | "framed";
  /** framed 時：戻る／ヘルプ／バナーを隠して棚だけ見せる（定規・校正向け） */
  hideChrome?: boolean;
  /** レイアウト定規の下書きなど、見た目配置の一時上書き */
  itemLayoutOverride?: Partial<Record<ForestBookshelfItemId, ForestBookshelfRect>>;
  /** レイアウト定規の下書きなど、タップ領域の一時上書き */
  spotLayoutOverride?: Partial<Record<ForestBookshelfSpotId, ForestBookshelfRect>>;
};

type PanelMode = "none" | "create" | "list-kantei" | "list-diary";

function formatDiaryLines(book: ForestBookshelfDiaryItem): string[] {
  return [
    `収録期間：${book.periodLabel}`,
    `作成日：${book.createdLabel}`,
    `記録：${book.entryCount}件`,
  ];
}

export function ForestBookshelfClient({
  activeProfileLabel,
  activeProfileId,
  entitlement,
  kanteiBooks,
  diaryBooks,
  blockCreate,
  deployRevision = null,
  layout = "immersive",
  hideChrome = false,
  itemLayoutOverride,
  spotLayoutOverride,
}: Props) {
  const router = useRouter();
  const [selectedSpot, setSelectedSpot] = useState<ForestBookshelfSpotId | null>(null);
  const [panel, setPanel] = useState<PanelMode>("none");
  const [tourKanteiPeekOpen, setTourKanteiPeekOpen] = useState(false);
  const [spotGuideKind, setSpotGuideKind] = useState<ForestBookshelfSpotGuideKind | null>(null);

  const featuredKantei = kanteiBooks[0] ?? null;
  const currentDiary = diaryBooks[0] ?? null;
  const secondDiary = diaryBooks[1] ?? null;
  const thirdDiary = diaryBooks[2] ?? null;
  const immersive = layout === "immersive";
  const showChrome = !hideChrome;

  useEffect(() => {
    if (!immersive) {
      setSpotGuideKind(null);
      return;
    }
    setSpotGuideKind(
      resolveForestBookshelfSpotGuide({
        hasKantei: Boolean(featuredKantei),
        hasAshiatoBook: Boolean(currentDiary),
      }),
    );
  }, [immersive, featuredKantei, currentDiary]);

  const spotlightSpotId = spotGuideKind ? spotIdForBookshelfGuide(spotGuideKind) : null;

  const completeSpotGuideIfMatching = useCallback((spotId: ForestBookshelfSpotId) => {
    setSpotGuideKind((prev) => {
      if (!prev) return null;
      if (spotIdForBookshelfGuide(prev) !== spotId) return prev;
      markForestBookshelfSpotGuideSeen(prev);
      return null;
    });
  }, []);

  const openKanteiHref = useCallback(
    (href: string) => {
      completeSpotGuideIfMatching("kanteiCover");
      const inTour = Boolean(readLoghouseTourStep());
      const isRealOrderRead = href.startsWith("/orders/") && href.includes("/read");
      if (inTour && !isRealOrderRead) {
        setSelectedSpot(null);
        setTourKanteiPeekOpen(true);
        return;
      }
      router.push(href);
    },
    [completeSpotGuideIfMatching, router],
  );

  const itemLayout = useMemo(
    () => ({ ...FOREST_BOOKSHELF_ITEM_LAYOUT, ...itemLayoutOverride }),
    [itemLayoutOverride],
  );
  const spotLayout = useMemo(
    () => ({ ...FOREST_BOOKSHELF_SPOT_LAYOUT, ...spotLayoutOverride }),
    [spotLayoutOverride],
  );

  const closeAll = useCallback(() => {
    setSelectedSpot(null);
    setPanel("none");
  }, []);

  useEffect(() => {
    const resumeFromQuery =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("createBook") === "1";
    const draft = readDiaryBookCreateDraft();
    if (resumeFromQuery || draft?.periodChecked) {
      setPanel("create");
    }
  }, []);

  const peekCard = useMemo((): ForestBookshelfPeekCardModel | null => {
    if (!selectedSpot) return null;

    if (selectedSpot === "createDiary") {
      return {
        id: "create",
        title: "あしあとブックを作る",
        lines: ["新しい表紙と名前を決めて、新しいあしあとブックを作ります。"],
        actionLabel: "作る",
        onAction: () => {
          setSelectedSpot(null);
          setPanel("create");
        },
      };
    }

    if (selectedSpot === "kanteiCover" && featuredKantei) {
      return {
        id: featuredKantei.id,
        title: featuredKantei.title,
        lines: [`作成日：${featuredKantei.createdLabel}`, featuredKantei.subtitle],
        actionLabel: "選ぶ",
        onAction: () => openKanteiHref(featuredKantei.href),
      };
    }

    if (selectedSpot === "currentDiary" && currentDiary) {
      return {
        id: currentDiary.id,
        title: currentDiary.title,
        lines: formatDiaryLines(currentDiary),
        actionLabel: "選ぶ",
        onAction: () => {
          completeSpotGuideIfMatching("currentDiary");
          router.push(currentDiary.href);
        },
      };
    }

    if (selectedSpot === "placeholderRed") {
      if (thirdDiary) {
        return {
          id: thirdDiary.id,
          title: thirdDiary.title,
          lines: formatDiaryLines(thirdDiary),
          actionLabel: "選ぶ",
          onAction: () => router.push(thirdDiary.href),
        };
      }
      return {
        id: "placeholder-red",
        title: "これから増えていきます",
        lines: ["新しいあしあとブックを作ると、ここに並びます。"],
        actionLabel: "作る",
        onAction: () => {
          setSelectedSpot(null);
          setPanel("create");
        },
      };
    }

    if (selectedSpot === "placeholderGreen") {
      if (secondDiary) {
        return {
          id: secondDiary.id,
          title: secondDiary.title,
          lines: formatDiaryLines(secondDiary),
          actionLabel: "選ぶ",
          onAction: () => router.push(secondDiary.href),
        };
      }
      return {
        id: "placeholder-green",
        title: "これまでのあしあとブック",
        lines: ["過去のあしあとブックが増えると、ここに代表の一冊を置けます。"],
        actionLabel: "一覧を見る",
        onAction: () => {
          setSelectedSpot(null);
          setPanel("list-diary");
        },
      };
    }

    return null;
  }, [
    selectedSpot,
    featuredKantei,
    currentDiary,
    secondDiary,
    thirdDiary,
    router,
    openKanteiHref,
    completeSpotGuideIfMatching,
  ]);

  const kanteiListItems: ForestBookshelfListItem[] = kanteiBooks.map((b) => ({
    id: b.id,
    title: b.title,
    subtitle: b.createdLabel,
    href: b.href,
  }));

  const diaryListItems: ForestBookshelfListItem[] = diaryBooks.map((b) => ({
    id: b.id,
    title: b.title,
    subtitle: `${b.periodLabel} · ${b.entryCount}件`,
    href: b.href,
  }));

  const activateSpot = (id: ForestBookshelfSpotId) => {
    if (spotlightSpotId && id !== spotlightSpotId) {
      // 案内中は光っている場所以外は触らせない（迷わない）
      return;
    }
    completeSpotGuideIfMatching(id);
    setPanel("none");
    if (id === "spinesFortune") {
      setSelectedSpot(null);
      setPanel("list-kantei");
      return;
    }
    if (id === "spinesDiary") {
      setSelectedSpot(null);
      setPanel("list-diary");
      return;
    }
    setSelectedSpot(id);
  };

  const redCover = thirdDiary?.coverSrc ?? FOREST_BOOKSHELF_ASSETS.placeholderRed;
  const greenCover = secondDiary?.coverSrc ?? FOREST_BOOKSHELF_ASSETS.placeholderGreen;
  const kanteiCover = featuredKantei?.coverSrc ?? "/images/kantei-cover.png?v=1";
  const { widthPx, heightPx } = FOREST_BOOKSHELF_INTRINSIC;
  const spotGuideQuote = spotGuideKind ? owlQuoteForBookshelfGuide(spotGuideKind) : null;
  /** 鑑定書は上段なのでカードは下、あしあとブックは中段なのでカードは上 */
  const spotGuideCardAtTop = spotGuideKind === "ashiato";

  const scene = (
    <div
      className={[
        "relative",
        immersive ? "overflow-hidden" : "mx-auto w-full overflow-visible rounded-2xl shadow-[0_14px_40px_rgba(60,40,20,0.18)]",
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        immersive
          ? {
              // 画面を覆う。高さは aspect-ratio に任せ、幅と高さの二重指定で比率が崩れないようにする
              aspectRatio: `${widthPx} / ${heightPx}`,
              width: `max(100vw, calc(100dvh * ${widthPx} / ${heightPx}))`,
              height: "auto",
            }
          : {
              aspectRatio: `${widthPx} / ${heightPx}`,
              width: "100%",
            }
      }
    >
      {/* 旧ディープリンク互換 */}
      <div id="bookshelf-kantei-books" className="h-0 scroll-mt-24" aria-hidden />
      <div id="bookshelf-diary-books" className="h-0 scroll-mt-24" aria-hidden />

      {/* 鑑定結果と同じ部屋背景 → 本棚本体（上部透明）→ 本 */}
      <div
        className={[
          "absolute inset-0",
          immersive ? "" : "overflow-hidden rounded-2xl",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <Image
          src={FOREST_BOOKSHELF_ASSETS.background}
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
          unoptimized
        />
        <Image
          src={FOREST_BOOKSHELF_ASSETS.main}
          alt="森の本棚"
          fill
          priority
          // 定規と同じ比率で収める（aspect を崩す object-fill は使わない）
          className="object-contain object-bottom"
          sizes="100vw"
          unoptimized
        />
      </div>

      {/* 本ビジュアル＋天板装飾（床ランタンはアップ構図のため非表示） */}
      <div className="absolute inset-0">
        <ForestBookshelfItem
          rect={itemLayout.plant}
          src={FOREST_BOOKSHELF_ASSETS.plant}
          alt=""
          zIndex={3}
        />
        <ForestBookshelfItem
          rect={itemLayout.lanternShelf}
          src={FOREST_BOOKSHELF_ASSETS.lanternShelf}
          alt=""
          zIndex={3}
        />
        <ForestBookshelfItem
          rect={itemLayout.kanteiCover}
          src={kanteiCover}
          alt={featuredKantei ? featuredKantei.title : "鑑定書"}
          className={featuredKantei ? "" : "opacity-55"}
          emphasized={selectedSpot === "kanteiCover" || spotlightSpotId === "kanteiCover"}
        />
        <ForestBookshelfItem
          rect={itemLayout.spinesFortune}
          src={FOREST_BOOKSHELF_ASSETS.spinesFortune}
          alt=""
          emphasized={panel === "list-kantei"}
        />
        <ForestBookshelfItem
          rect={itemLayout.createDiary}
          src={FOREST_BOOKSHELF_ASSETS.createDiarySet}
          alt=""
          emphasized={selectedSpot === "createDiary" || panel === "create"}
        />
        {currentDiary ? (
          <ForestBookshelfItem
            rect={itemLayout.currentDiary}
            src={currentDiary.coverSrc}
            alt={currentDiary.title}
            emphasized={selectedSpot === "currentDiary" || spotlightSpotId === "currentDiary"}
          />
        ) : null}
        <ForestBookshelfItem
          rect={itemLayout.placeholderRed}
          src={redCover}
          alt=""
          emphasized={selectedSpot === "placeholderRed"}
        />
        <ForestBookshelfItem
          rect={itemLayout.placeholderGreen}
          src={greenCover}
          alt=""
          emphasized={selectedSpot === "placeholderGreen"}
        />
        <ForestBookshelfItem
          rect={itemLayout.spinesDiary}
          src={FOREST_BOOKSHELF_ASSETS.spinesDiary}
          alt=""
          emphasized={panel === "list-diary"}
        />
        <ForestBookshelfItem rect={itemLayout.owl} src={FOREST_BOOKSHELF_ASSETS.owl} alt="" />
      </div>

      {spotlightSpotId ? (
        <div
          className="pointer-events-none absolute inset-0 z-[23] bg-stone-950/45 transition-opacity duration-300"
          aria-hidden
        />
      ) : null}

      <ForestBookshelfTapSpot
        rect={spotLayout.kanteiCover}
        label="鑑定書を選ぶ"
        disabled={!featuredKantei}
        selected={selectedSpot === "kanteiCover"}
        spotlight={spotlightSpotId === "kanteiCover"}
        onActivate={() => activateSpot("kanteiCover")}
      />
      <ForestBookshelfTapSpot
        rect={spotLayout.spinesFortune}
        label="鑑定書一覧を開く"
        selected={panel === "list-kantei"}
        onActivate={() => activateSpot("spinesFortune")}
      />
      <ForestBookshelfTapSpot
        rect={spotLayout.createDiary}
        label="あしあとブックを作る"
        selected={selectedSpot === "createDiary" || panel === "create"}
        onActivate={() => activateSpot("createDiary")}
      />
      <ForestBookshelfTapSpot
        rect={spotLayout.currentDiary}
        label="現在のあしあとブックを選ぶ"
        disabled={!currentDiary}
        selected={selectedSpot === "currentDiary"}
        spotlight={spotlightSpotId === "currentDiary"}
        onActivate={() => activateSpot("currentDiary")}
      />
      <ForestBookshelfTapSpot
        rect={spotLayout.placeholderRed}
        label="あしあとブック（右側）"
        selected={selectedSpot === "placeholderRed"}
        onActivate={() => activateSpot("placeholderRed")}
      />
      <ForestBookshelfTapSpot
        rect={spotLayout.placeholderGreen}
        label="これまでのあしあとブック（代表）"
        selected={selectedSpot === "placeholderGreen"}
        onActivate={() => activateSpot("placeholderGreen")}
      />
      <ForestBookshelfTapSpot
        rect={spotLayout.spinesDiary}
        label="これまでのあしあとブック一覧を開く"
        selected={panel === "list-diary"}
        onActivate={() => activateSpot("spinesDiary")}
      />

      {peekCard ? (
        <>
          <button
            type="button"
            className="absolute inset-0 z-[25] bg-stone-900/20"
            aria-label="カードを閉じる"
            onClick={closeAll}
          />
          <ForestBookshelfPeekCard card={peekCard} onClose={closeAll} />
        </>
      ) : null}
    </div>
  );

  return (
    <div
      className={immersive ? "relative isolate min-h-[100dvh] w-full overflow-hidden" : "relative"}
      style={{ backgroundColor: FOREST_BOOKSHELF_PAGE_BG }}
    >
      <FirstVisitFlowBrowserBackGuard />

      {immersive ? (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between gap-3 px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <LogHouseTourAwareBackLink
              href="/orders"
              fallbackLabel={LOG_HOUSE_BACK_TO_LINK_LABEL}
              className="pointer-events-auto inline-flex min-h-11 items-center rounded-full border-2 border-[#b8893d]/70 bg-[#fffdf8]/95 px-3.5 text-sm font-semibold text-[#5c4a3a] shadow-md backdrop-blur-[3px]"
            />
            <div className="pointer-events-auto relative flex max-w-[58%] items-start justify-end gap-2">
              <ForestBookshelfHelp enableFirstVisitTip={!spotGuideKind} />
              <p className="pointer-events-none min-w-0 rounded-full border border-[#d9cbb8]/70 bg-[#fffdf8]/75 px-2.5 py-2 text-right text-[11px] leading-tight text-[#6a5846] shadow-sm backdrop-blur-[3px]">
                「{activeProfileLabel}」
                {deployRevision ? (
                  <span className="mt-0.5 block text-[9px] text-[#9a8b78]" title="デプロイ確認用">
                    反映 {deployRevision}
                  </span>
                ) : null}
              </p>
            </div>
          </div>

          {spotGuideKind && spotGuideQuote ? (
            <div
              className={[
                "pointer-events-none absolute inset-x-0 z-[58] flex justify-center px-4",
                spotGuideCardAtTop
                  ? "top-[4.75rem]"
                  : "bottom-6 pb-[env(safe-area-inset-bottom)]",
              ].join(" ")}
            >
              <section
                aria-label="本棚のご案内"
                className={`${companionWritingFloatingGuideClass} pointer-events-auto max-w-sm`}
              >
                <div className="flex items-start gap-2.5">
                  <CharacterFaceIcon name="character-owl-face" />
                  <p
                    className={`min-w-0 flex-1 whitespace-pre-line ${companionWritingGuideBodyClass} mt-0`}
                  >
                    {spotGuideQuote}
                  </p>
                </div>
              </section>
            </div>
          ) : null}

          {(entitlement.showTrialBanner || (!featuredKantei && activeProfileId)) && (
            <div className="pointer-events-none absolute inset-x-0 top-[4.5rem] z-30 px-3">
              <div className="pointer-events-auto mx-auto max-w-md space-y-2">
                <TrialStatusBanner entitlement={entitlement} />
                {!featuredKantei && activeProfileId ? (
                  <KanteiMissingBanner profileId={activeProfileId} />
                ) : null}
              </div>
            </div>
          )}

          <div className="relative flex h-[100dvh] w-[100vw] items-center justify-center overflow-hidden">
            {scene}
          </div>
        </>
      ) : (
        <>
          {showChrome ? (
            <div className="mx-auto max-w-3xl space-y-3 px-3 pb-4 pt-3 sm:px-4 sm:pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <LogHouseTourAwareBackLink
                  href="/orders"
                  fallbackLabel={LOG_HOUSE_BACK_TO_LINK_LABEL}
                  className={`text-sm ${LJD_PAPER_LINK_CLASS}`}
                />
                <div className="relative flex items-center gap-2">
                  <ForestBookshelfHelp enableFirstVisitTip={false} />
                  <p className="text-xs text-[#6a5846]">
                    表示中: <span className="font-medium text-[#3f3428]">「{activeProfileLabel}」</span>
                    {deployRevision ? (
                      <span className="ml-2 text-[10px] text-[#9a8b78]" title="デプロイ確認用">
                        反映 {deployRevision}
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>

              <TrialStatusBanner entitlement={entitlement} />

              {!featuredKantei && activeProfileId ? (
                <KanteiMissingBanner profileId={activeProfileId} />
              ) : null}
            </div>
          ) : null}

          <div
            className={[
              "relative mx-auto w-full px-2 pb-6",
              hideChrome ? "max-w-[22rem] sm:max-w-[24rem]" : "max-w-[28rem] sm:max-w-[32rem] sm:px-4",
            ].join(" ")}
          >
            {scene}
            {showChrome ? (
              <p className="mt-3 text-center text-[11px] leading-relaxed text-[#8a7b6a]">
                本をタップしてカードを開き、「選ぶ」で詳細へ進みます。背表紙は一覧です。
              </p>
            ) : null}
          </div>
        </>
      )}

      {panel === "list-kantei" ? (
        <ForestBookshelfListPanel
          title="鑑定書一覧"
          emptyMessage="まだ鑑定書がありません。"
          items={kanteiListItems}
          onClose={closeAll}
          onItemSelect={(item) => {
            const inTour = Boolean(readLoghouseTourStep());
            const isRealOrderRead = item.href.startsWith("/orders/") && item.href.includes("/read");
            if (inTour && !isRealOrderRead) {
              closeAll();
              setTourKanteiPeekOpen(true);
              return true;
            }
            return false;
          }}
        />
      ) : null}

      {panel === "list-diary" ? (
        <ForestBookshelfListPanel
          title="これまでのあしあとブック"
          emptyMessage="まだあしあとブックがありません。左のセットから作れます。"
          items={diaryListItems}
          onClose={closeAll}
        />
      ) : null}

      {panel === "create" ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-stone-900/35 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-12 sm:items-center sm:pb-8">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="作成を閉じる"
            onClick={closeAll}
          />
          <div className="relative z-[1] max-h-[min(85dvh,40rem)] w-full max-w-lg overflow-y-auto rounded-[1.25rem] border border-[#e4d5c0]/95 bg-[#fdf8f0] p-3 shadow-[0_16px_40px_rgba(60,40,20,0.28)] sm:p-4">
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={closeAll}
                className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full border border-[#e0d2bc] bg-[#faf3e8] text-[#6a5846]"
                aria-label="閉じる"
              >
                ✕
              </button>
            </div>
            <DiaryBookCreateForm
              blockContinuedFeatures={blockCreate}
              defaultOpen
              onCreated={(book) => {
                closeAll();
                router.push(`/orders/bookshelf/diary-book/${book.id}`);
              }}
            />
          </div>
        </div>
      ) : null}

      {tourKanteiPeekOpen ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-stone-900/40 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-16 sm:items-center sm:pb-8">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="閉じる"
            onClick={() => setTourKanteiPeekOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="鑑定書のご案内"
            className="relative z-[1] w-full max-w-sm rounded-[1.25rem] border border-[#e4d5c0]/95 bg-[#fffbf5] p-4 shadow-[0_16px_40px_rgba(60,40,20,0.28)]"
          >
            <p className="whitespace-pre-line text-sm leading-relaxed text-[#5c4a35]">
              {LOGHOUSE_TOUR_KANTEI_PREVIEW_PEEK}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href={readLoghouseTourReturnHref()}
                className={companionWritingGuidePrimaryButtonClass}
              >
                ← {LOGHOUSE_TOUR_RETURN_LABEL}
              </Link>
              <button
                type="button"
                onClick={() => setTourKanteiPeekOpen(false)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl text-sm font-medium text-[#6a5846]"
              >
                本棚に戻る
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
