"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { OnboardingLockedTap } from "@/components/onboarding/OnboardingLockedTap";
import { useOnboardingStage } from "@/components/onboarding/OnboardingStageProvider";
import { OwlNavButton } from "@/components/ui/OwlNavButton";
import { LOG_HOUSE_LOADING_LABEL, LOG_HOUSE_NAV_LABEL } from "@/lib/journal/logHouseLabels";
import type { OnboardingFeature } from "@/lib/onboarding/onboardingStage";

const TAB_CLASS =
  "flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 font-medium";

const NAV_ITEMS = [
  {
    href: "/orders/calendar",
    label: "カレンダー",
    loadingLabel: "カレンダーを開いています…",
    feature: "bottom_calendar" as const,
    isActive: (pathname: string) => pathname === "/orders/calendar",
  },
  {
    href: "/orders/list",
    label: "日記一覧",
    loadingLabel: "日記一覧を開いています…",
    feature: "bottom_list" as const,
    isActive: (pathname: string) => pathname === "/orders/list",
  },
  {
    href: "/orders/bookshelf",
    label: "本棚",
    loadingLabel: "本棚を開いています…",
    feature: "bottom_bookshelf" as const,
    isActive: (pathname: string) => pathname.startsWith("/orders/bookshelf"),
  },
  {
    href: "/orders",
    label: LOG_HOUSE_NAV_LABEL,
    loadingLabel: LOG_HOUSE_LOADING_LABEL,
    feature: "bottom_loghouse" as const,
    isActive: (pathname: string) => pathname === "/orders",
  },
] as const;

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
        className={`h-1 w-8 rounded-full ${active ? "bg-emerald-600/70" : "bg-transparent"}`}
        aria-hidden
      />
      {item.label}
    </>
  );

  if (active) {
    return (
      <span className={`${TAB_CLASS} text-emerald-900`} aria-current="page">
        {tabContent}
      </span>
    );
  }

  if (!unlocked && !syncing) {
    return (
      <OnboardingLockedTap feature={item.feature} className="flex flex-1">
        <span className={`${TAB_CLASS} w-full text-stone-400`}>{tabContent}</span>
      </OnboardingLockedTap>
    );
  }

  if (syncing) {
    return (
      <span className={`${TAB_CLASS} text-stone-500`} aria-busy="true">
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
      className={`${TAB_CLASS} text-stone-500 hover:text-stone-800`}
    >
      {tabContent}
    </OwlNavButton>
  );
}

/** ログイン後の主要画面用・下部ナビ（カレンダー / 日記一覧 / 本棚 / ログハウス） */
export function DiaryHomeBottomNav() {
  const pathname = usePathname();
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
      className="lj-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-emerald-100/90 bg-[#fffdf9]/95 backdrop-blur-md"
      aria-label="日記メニュー"
      aria-busy={syncing || undefined}
    >
      <div className="mx-auto flex max-w-3xl pb-[max(0px,env(safe-area-inset-bottom))]">
        {NAV_ITEMS.map((item) => (
          <BottomNavTab
            key={item.href}
            item={item}
            active={item.isActive(pathname)}
            unlocked={isFeatureUnlocked(item.feature)}
            syncing={syncing}
          />
        ))}
      </div>
    </nav>
  );
}
