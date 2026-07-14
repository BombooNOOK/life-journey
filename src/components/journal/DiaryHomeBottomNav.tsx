"use client";

import Image from "next/image";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { OnboardingLockedTap } from "@/components/onboarding/OnboardingLockedTap";
import { useOnboardingStage } from "@/components/onboarding/OnboardingStageProvider";
import { OwlNavButton } from "@/components/ui/OwlNavButton";
import { LOG_HOUSE_LOADING_LABEL, LOG_HOUSE_NAV_LABEL } from "@/lib/journal/logHouseLabels";
import { LJD_NAV_ICONS } from "@/lib/ljd/ljdPaperSurface";

const TAB_CLASS =
  "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-medium tracking-wide";

/** 現在地：ミントではなく、黄み寄りのセージ／オリーブ（生成りナビになじむ森の緑） */
const ACTIVE_LOCATOR = "#66724e";
const ACTIVE_LABEL = "#4a5440";

const NAV_ITEMS = [
  {
    href: "/orders/calendar",
    label: "カレンダー",
    loadingLabel: "カレンダーを開いています…",
    feature: "bottom_calendar" as const,
    iconSrc: LJD_NAV_ICONS.calendar,
    isActive: (pathname: string) => pathname === "/orders/calendar",
  },
  {
    href: "/orders/list",
    label: "日記一覧",
    loadingLabel: "日記一覧を開いています…",
    feature: "bottom_list" as const,
    iconSrc: LJD_NAV_ICONS.diaryList,
    isActive: (pathname: string) => pathname === "/orders/list",
  },
  {
    href: "/orders/bookshelf",
    label: "本棚",
    loadingLabel: "本棚を開いています…",
    feature: "bottom_bookshelf" as const,
    iconSrc: LJD_NAV_ICONS.bookshelf,
    isActive: (pathname: string) => pathname.startsWith("/orders/bookshelf"),
  },
  {
    href: "/orders",
    label: LOG_HOUSE_NAV_LABEL,
    loadingLabel: LOG_HOUSE_LOADING_LABEL,
    feature: "bottom_loghouse" as const,
    iconSrc: LJD_NAV_ICONS.loghouse,
    isActive: (pathname: string) => pathname === "/orders",
  },
] as const;

function NavIcon({
  src,
  active,
  muted,
}: {
  src: string;
  active: boolean;
  muted?: boolean;
}) {
  return (
    <span
      className={[
        "relative flex h-8 w-8 items-center justify-center transition",
        active
          ? "opacity-100 [filter:sepia(0.16)_hue-rotate(38deg)_saturate(0.7)_brightness(0.92)]"
          : muted
            ? "opacity-40 saturate-50"
            : "opacity-75",
      ].join(" ")}
    >
      <Image
        src={src}
        alt=""
        width={64}
        height={64}
        className="h-7 w-7 object-contain"
        unoptimized
        draggable={false}
      />
    </span>
  );
}

function BottomNavTab({
  item,
  active,
  unlocked,
  syncing,
}: {
  item: (typeof NAV_ITEMS)[number];
  active: boolean;
  unlocked: boolean;
  syncing: boolean;
}) {
  const tabContent = (
    <>
      <span
        className="mb-0.5 h-1 w-8 rounded-full"
        style={active ? { backgroundColor: ACTIVE_LOCATOR, opacity: 0.88 } : undefined}
        aria-hidden
      />
      <NavIcon src={item.iconSrc} active={active} muted={!unlocked && !active} />
      <span style={active ? { color: ACTIVE_LABEL } : undefined}>{item.label}</span>
    </>
  );

  if (active) {
    return (
      <span className={TAB_CLASS} style={{ color: ACTIVE_LABEL }} aria-current="page">
        {tabContent}
      </span>
    );
  }

  if (!unlocked && !syncing) {
    return (
      <OnboardingLockedTap feature={item.feature} className="flex flex-1">
        <span className={`${TAB_CLASS} w-full text-[#9a8b78]`}>{tabContent}</span>
      </OnboardingLockedTap>
    );
  }

  if (syncing) {
    return (
      <span className={`${TAB_CLASS} text-[#8a7b6a]`} aria-busy="true">
        {tabContent}
      </span>
    );
  }

  return (
    <OwlNavButton
      href={item.href}
      loadingLabel={item.loadingLabel}
      compactLoading
      matchPathname={item.isActive}
      className={`${TAB_CLASS} text-[#7a6a58] hover:text-[#4a3a28]`}
    >
      {tabContent}
    </OwlNavButton>
  );
}

/** ログイン後の主要画面用・下部ナビ（カレンダー / 日記一覧 / 本棚 / ログハウス） */
export function DiaryHomeBottomNav({
  forceActivePath,
}: {
  /** プレビュー枠などで、パスに関係なく選択タブを固定したいとき */
  forceActivePath?: string;
} = {}) {
  const pathname = usePathname();
  const activePath = forceActivePath ?? pathname;
  const router = useRouter();
  const { ready, isFeatureUnlocked } = useOnboardingStage();
  const syncing = !ready;

  useEffect(() => {
    if (syncing) return;
    for (const item of NAV_ITEMS) {
      if (isFeatureUnlocked(item.feature)) {
        router.prefetch(item.href);
      }
    }
  }, [isFeatureUnlocked, router, syncing]);

  return (
    <nav
      className="lj-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-[#e8dcc8]/80 bg-[#f7f0e4]/96 backdrop-blur-md"
      aria-label="日記メニュー"
      aria-busy={syncing || undefined}
    >
      <div className="mx-auto flex max-w-3xl pb-[max(0px,env(safe-area-inset-bottom))]">
        {NAV_ITEMS.map((item) => (
          <BottomNavTab
            key={item.href}
            item={item}
            active={item.isActive(activePath)}
            unlocked={isFeatureUnlocked(item.feature)}
            syncing={syncing}
          />
        ))}
      </div>
    </nav>
  );
}
