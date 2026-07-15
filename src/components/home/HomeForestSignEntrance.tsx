"use client";

import { useLayoutEffect, useMemo, useState } from "react";

import { buildLoginHref } from "@/app/login/loginFlow";
import { useFirebaseAuth } from "@/components/auth/FirebaseAuthProvider";
import { CompanionWritingFarewellBanner } from "@/components/journal/companion-writing/CompanionWritingFarewellBanner";
import { HomeForestSignStage } from "@/components/home/HomeForestSignStage";
import { ReadingFontSizeControl } from "@/components/reading/ReadingFontSizeControl";
import { useLogHouseRoomTimeTheme } from "@/hooks/useLogHouseRoomTimeOfDay";
import { isLjLoggedInOnClient } from "@/lib/auth/clientCookies";
import { HOME_FOREST_SIGN_NAV_LABELS, type HomeForestSignViewport } from "@/lib/home/homeForestSignLayout";
import { buildForestMapHref } from "@/lib/help/forestMapNav";
import { FIRST_VISIT_ROUTES } from "@/lib/onboarding/firstVisitWizard/routes";

function buildNavItems(isLoggedIn: boolean) {
  return [
    {
      id: "loghouse",
      href: isLoggedIn ? "/orders" : buildLoginHref("/orders"),
      label: HOME_FOREST_SIGN_NAV_LABELS.loghouse,
    },
    {
      id: "first",
      href: FIRST_VISIT_ROUTES.pathGuide,
      label: HOME_FOREST_SIGN_NAV_LABELS.first,
    },
    {
      id: "forest-map",
      href: buildForestMapHref("/"),
      label: HOME_FOREST_SIGN_NAV_LABELS["forest-map"],
    },
    {
      id: "ljd-help",
      href: "/help/ljd",
      label: HOME_FOREST_SIGN_NAV_LABELS["ljd-help"],
    },
  ] as const;
}

const mobileFontSizeBandClass =
  "relative mx-auto w-full max-w-[min(17rem,78vw)] border-t border-stone-300/40 px-1 pb-2.5 pt-2.5 sm:max-w-[17rem]";

const pcFontSizeBandClass =
  "w-full max-w-[17rem] border-t border-stone-300/40 bg-[#fffdf9]/75 px-3 pb-2.5 pt-2 backdrop-blur-[1px]";

function useForestSignViewport(): HomeForestSignViewport | null {
  const [viewport, setViewport] = useState<HomeForestSignViewport | null>(null);

  useLayoutEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setViewport(media.matches ? "desktop" : "mobile");
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return viewport;
}

/** BambooNOOKの森の入口：1画面・案内板背景＋看板上のテキストリンク */
export function HomeForestSignEntrance() {
  const { user } = useFirebaseAuth();
  const isLoggedIn = Boolean(user) || isLjLoggedInOnClient();
  const viewport = useForestSignViewport();
  const isDesktop = viewport === "desktop";
  const { timeOfDay } = useLogHouseRoomTimeTheme();

  const navById = useMemo(
    () => Object.fromEntries(buildNavItems(isLoggedIn).map((item) => [item.id, item])),
    [isLoggedIn],
  );
  const primaryNavId = isLoggedIn ? "loghouse" : "first";

  return (
    <section
      className="home-read-scope relative flex min-h-[100dvh] flex-col overflow-hidden"
      style={{ backgroundColor: timeOfDay === "night" ? "#121820" : "#f3efe4" }}
    >
      {viewport ? (
        <HomeForestSignStage
          key={viewport}
          viewport={viewport}
          navById={navById}
          primaryNavId={primaryNavId}
          isLoggedIn={isLoggedIn}
        />
      ) : null}

      <div
        className="pointer-events-none mx-auto w-full max-w-3xl px-4 pt-10 sm:px-6 sm:pt-11 lg:py-12"
        style={{ position: "absolute", top: 0, right: 0, left: 0, zIndex: 20 }}
      >
        <div className="pointer-events-auto">
          <CompanionWritingFarewellBanner />
        </div>
      </div>

      <div
        className={[
          "pointer-events-none absolute z-20 pb-3",
          isDesktop ? "right-0 bottom-0 px-6" : "inset-x-0 bottom-0 px-4 sm:px-6",
        ].join(" ")}
      >
        <div
          className={[
            isDesktop ? pcFontSizeBandClass : mobileFontSizeBandClass,
            "pointer-events-auto",
            isDesktop ? "" : "mx-auto w-full max-w-3xl",
          ].join(" ")}
        >
          <ReadingFontSizeControl variant="hero" comfortable />
        </div>
      </div>
    </section>
  );
}
