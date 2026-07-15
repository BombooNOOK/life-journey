"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

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
import { TrialStatusBanner } from "@/components/entitlement/TrialStatusBanner";
import { KanteiMissingBanner } from "@/components/orders/KanteiMissingBanner";
import { FirstVisitFlowBrowserBackGuard } from "@/components/orders/FirstVisitFlowBrowserBackGuard";
import type { SerializedUserEntitlement } from "@/lib/entitlement/resolveUserEntitlement";
import {
  FOREST_BOOKSHELF_ASSETS,
  FOREST_BOOKSHELF_INTRINSIC,
  FOREST_BOOKSHELF_PAGE_BG,
} from "@/lib/ljd/forestBookshelfAssets";
import {
  FOREST_BOOKSHELF_ITEM_LAYOUT,
  FOREST_BOOKSHELF_SPOT_LAYOUT,
  type ForestBookshelfItemId,
  type ForestBookshelfRect,
  type ForestBookshelfSpotId,
} from "@/lib/ljd/forestBookshelfLayout";
import { LOG_HOUSE_BACK_TO_LINK_LABEL } from "@/lib/journal/logHouseLabels";
import { LJD_PAPER_LINK_CLASS } from "@/lib/ljd/ljdPaperSurface";

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
  itemLayoutOverride,
  spotLayoutOverride,
}: Props) {
  const router = useRouter();
  const [selectedSpot, setSelectedSpot] = useState<ForestBookshelfSpotId | null>(null);
  const [panel, setPanel] = useState<PanelMode>("none");

  const itemLayout = useMemo(
    () => ({ ...FOREST_BOOKSHELF_ITEM_LAYOUT, ...itemLayoutOverride }),
    [itemLayoutOverride],
  );
  const spotLayout = useMemo(
    () => ({ ...FOREST_BOOKSHELF_SPOT_LAYOUT, ...spotLayoutOverride }),
    [spotLayoutOverride],
  );

  const featuredKantei = kanteiBooks[0] ?? null;
  const currentDiary = diaryBooks[0] ?? null;
  const secondDiary = diaryBooks[1] ?? null;
  const thirdDiary = diaryBooks[2] ?? null;

  const closeAll = useCallback(() => {
    setSelectedSpot(null);
    setPanel("none");
  }, []);

  const peekCard = useMemo((): ForestBookshelfPeekCardModel | null => {
    if (!selectedSpot) return null;

    if (selectedSpot === "createDiary") {
      return {
        id: "create",
        title: "日記ブックを作る",
        lines: ["新しい表紙と名前を決めて、新しい日記ブックを作ります。"],
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
        onAction: () => router.push(featuredKantei.href),
      };
    }

    if (selectedSpot === "currentDiary" && currentDiary) {
      return {
        id: currentDiary.id,
        title: currentDiary.title,
        lines: formatDiaryLines(currentDiary),
        actionLabel: "選ぶ",
        onAction: () => router.push(currentDiary.href),
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
        lines: ["新しい日記ブックを作ると、ここに並びます。"],
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
        title: "これまでの日記ブック",
        lines: ["過去の日記ブックが増えると、ここに代表の一冊を置けます。"],
        actionLabel: "一覧を見る",
        onAction: () => {
          setSelectedSpot(null);
          setPanel("list-diary");
        },
      };
    }

    return null;
  }, [selectedSpot, featuredKantei, currentDiary, secondDiary, thirdDiary, router]);

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

  return (
    <div className="relative" style={{ backgroundColor: FOREST_BOOKSHELF_PAGE_BG }}>
      <FirstVisitFlowBrowserBackGuard />

      <div className="mx-auto max-w-3xl space-y-3 px-3 pb-4 pt-3 sm:px-4 sm:pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link href="/orders" className={`text-sm ${LJD_PAPER_LINK_CLASS}`}>
            {LOG_HOUSE_BACK_TO_LINK_LABEL}
          </Link>
          <p className="text-xs text-[#6a5846]">
            表示中: <span className="font-medium text-[#3f3428]">「{activeProfileLabel}」</span>
            {deployRevision ? (
              <span className="ml-2 text-[10px] text-[#9a8b78]" title="デプロイ確認用">
                反映 {deployRevision}
              </span>
            ) : null}
          </p>
        </div>

        <TrialStatusBanner entitlement={entitlement} />

        {!featuredKantei && activeProfileId ? (
          <KanteiMissingBanner profileId={activeProfileId} />
        ) : null}
      </div>

      <div className="relative mx-auto w-full max-w-[28rem] px-2 pb-6 sm:max-w-[32rem] sm:px-4">
        {/* 旧ディープリンク互換（#bookshelf-kantei-books など） */}
        <div id="bookshelf-kantei-books" className="h-0 scroll-mt-24" aria-hidden />
        <div id="bookshelf-diary-books" className="h-0 scroll-mt-24" aria-hidden />
        <div
          className="relative mx-auto w-full overflow-visible"
          style={{
            aspectRatio: `${FOREST_BOOKSHELF_INTRINSIC.widthPx} / ${FOREST_BOOKSHELF_INTRINSIC.heightPx}`,
          }}
        >
          {/* 本棚本体 */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl shadow-[0_14px_40px_rgba(60,40,20,0.18)]">
            <Image
              src={FOREST_BOOKSHELF_ASSETS.main}
              alt="森の本棚"
              fill
              priority
              className="object-contain object-top"
              sizes="(max-width: 640px) 100vw, 512px"
              unoptimized
            />
          </div>

          {/* 装飾・本ビジュアル（本棚枠内） */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            <ForestBookshelfItem
              rect={itemLayout.plant}
              src={FOREST_BOOKSHELF_ASSETS.plant}
              alt=""
            />
            <ForestBookshelfItem
              rect={itemLayout.lanternShelf}
              src={FOREST_BOOKSHELF_ASSETS.lanternShelf}
              alt=""
            />
            <ForestBookshelfItem
              rect={itemLayout.kanteiCover}
              src={kanteiCover}
              alt={featuredKantei ? featuredKantei.title : "鑑定書"}
              className={featuredKantei ? "" : "opacity-55"}
              emphasized={selectedSpot === "kanteiCover"}
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
                emphasized={selectedSpot === "currentDiary"}
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
            <ForestBookshelfItem
              rect={itemLayout.owl}
              src={FOREST_BOOKSHELF_ASSETS.owl}
              alt=""
            />
          </div>

          {/* 外ランタン（本体外・前面） */}
          <ForestBookshelfItem
            rect={itemLayout.lanternFloor}
            src={FOREST_BOOKSHELF_ASSETS.lanternFloor}
            alt=""
            zIndex={6}
          />

          {/* タップ領域 */}
          <ForestBookshelfTapSpot
            rect={spotLayout.kanteiCover}
            label="鑑定書を選ぶ"
            disabled={!featuredKantei}
            selected={selectedSpot === "kanteiCover"}
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
            label="日記ブックを作る"
            selected={selectedSpot === "createDiary" || panel === "create"}
            onActivate={() => activateSpot("createDiary")}
          />
          <ForestBookshelfTapSpot
            rect={spotLayout.currentDiary}
            label="現在の日記ブックを選ぶ"
            disabled={!currentDiary}
            selected={selectedSpot === "currentDiary"}
            onActivate={() => activateSpot("currentDiary")}
          />
          <ForestBookshelfTapSpot
            rect={spotLayout.placeholderRed}
            label="日記ブック（右側）"
            selected={selectedSpot === "placeholderRed"}
            onActivate={() => activateSpot("placeholderRed")}
          />
          <ForestBookshelfTapSpot
            rect={spotLayout.placeholderGreen}
            label="これまでの日記ブック（代表）"
            selected={selectedSpot === "placeholderGreen"}
            onActivate={() => activateSpot("placeholderGreen")}
          />
          <ForestBookshelfTapSpot
            rect={spotLayout.spinesDiary}
            label="これまでの日記ブック一覧を開く"
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

        <p className="mt-3 text-center text-[11px] leading-relaxed text-[#8a7b6a]">
          本をタップしてカードを開き、「選ぶ」で詳細へ進みます。背表紙は一覧です。
        </p>
      </div>

      {panel === "list-kantei" ? (
        <ForestBookshelfListPanel
          title="鑑定書一覧"
          emptyMessage="まだ鑑定書がありません。"
          items={kanteiListItems}
          onClose={closeAll}
        />
      ) : null}

      {panel === "list-diary" ? (
        <ForestBookshelfListPanel
          title="これまでの日記ブック"
          emptyMessage="まだ日記ブックがありません。左のセットから作れます。"
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
    </div>
  );
}
