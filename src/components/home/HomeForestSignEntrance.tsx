"use client";

import { useMemo } from "react";

import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { CompanionWritingFarewellBanner } from "@/components/journal/companion-writing/CompanionWritingFarewellBanner";
import { HomeForestSignStage } from "@/components/home/HomeForestSignStage";
import { ReadingFontSizeControl } from "@/components/reading/ReadingFontSizeControl";
import { isLjLoggedInOnClient } from "@/lib/auth/clientCookies";
import { HOME_FOREST_SIGN_NAV_LABELS } from "@/lib/home/homeForestSignLayout";

const NAV_ITEMS = [
  {
    id: "loghouse",
    href: "/orders",
    label: HOME_FOREST_SIGN_NAV_LABELS.loghouse,
  },
  {
    id: "first",
    href: "/guide/first",
    label: HOME_FOREST_SIGN_NAV_LABELS.first,
  },
  {
    id: "companion",
    href: "/journal/with-companion",
    label: HOME_FOREST_SIGN_NAV_LABELS.companion,
  },
  {
    id: "ljd-help",
    href: "/help/ljd",
    label: HOME_FOREST_SIGN_NAV_LABELS["ljd-help"],
  },
] as const;

const mobileFontSizeBandClass =
  "relative z-20 mx-auto w-full max-w-[min(17rem,78vw)] border-t border-stone-300/40 px-1 pb-2.5 pt-2.5 sm:max-w-[17rem]";

const pcFontSizeBandClass = "w-full border-t border-stone-300/40 pb-2.5 pt-2";

/** BambooNOOKの森の入口：1画面・案内板背景＋看板上のテキストリンク */
export function HomeForestSignEntrance() {
  const { user } = useFirebaseAuth();
  const isLoggedIn = Boolean(user) || isLjLoggedInOnClient();

  const navById = useMemo(
    () => Object.fromEntries(NAV_ITEMS.map((item) => [item.id, item])),
    [],
  );
  const primaryNavId = isLoggedIn ? "loghouse" : "first";

  return (
    <section className="home-read-scope relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#f3efe4]">
      <HomeForestSignStage
        viewport="mobile"
        navById={navById}
        primaryNavId={primaryNavId}
        isLoggedIn={isLoggedIn}
        className="lg:hidden"
      />
      <HomeForestSignStage
        viewport="desktop"
        navById={navById}
        primaryNavId={primaryNavId}
        isLoggedIn={isLoggedIn}
        className="hidden lg:block"
      />

      <div className="pointer-events-none relative z-20 mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col px-4 pb-3 pt-10 sm:px-6 sm:pt-11 lg:py-12">
        <div className="pointer-events-auto">
          <CompanionWritingFarewellBanner />
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:hidden">
          <div className="mt-auto pb-1 pt-6 sm:pt-8">
            <div className={`${mobileFontSizeBandClass} pointer-events-auto`}>
              <ReadingFontSizeControl variant="hero" comfortable />
            </div>
          </div>
        </div>

        <div className="mt-auto hidden pb-1 lg:block">
          <div className={`${pcFontSizeBandClass} pointer-events-auto max-w-[17rem]`}>
            <ReadingFontSizeControl variant="hero" comfortable />
          </div>
        </div>
      </div>
    </section>
  );
}
