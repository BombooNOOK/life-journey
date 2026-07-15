"use client";

import Image from "next/image";

import { buildLoginHref } from "@/app/login/loginFlow";
import { OnboardingLockedTap } from "@/components/onboarding/OnboardingLockedTap";
import { useOnboardingStage } from "@/components/onboarding/OnboardingStageProvider";
import { OwlNavButton } from "@/components/ui/OwlNavButton";
import { HOME_FOREST_SIGN_OWL_TEACHER_SRC } from "@/lib/home/homeForestSignAssets";
import { HOME_HERO_OWL_TEACHER_SRC } from "@/lib/home/homeHeroAssets";
import {
  HOME_FOREST_SIGN_LOG_HOUSE_NOTE,
  HOME_FOREST_SIGN_LOGIN_NOTE_PREVIEW_TEXT,
  HOME_FOREST_SIGN_NAV_LOADING_LABELS,
  HOME_FOREST_SIGN_SLOT_NAV_IDS,
  HOME_FOREST_SIGN_SUBTITLE_TEXT,
  HOME_FOREST_SIGN_TITLE_TEXT,
  homeForestSignDesignSize,
  homeForestSignImagePlacementStyle,
  homeForestSignLayoutFor,
  homeForestSignPlacementStyle,
  homeForestSignTextColors,
  type HomeForestSignSignSlotId,
  type HomeForestSignTextPlacement,
  type HomeForestSignViewport,
  type ObjectCoverLayout,
} from "@/lib/home/homeForestSignLayout";
import type { LogHouseRoomTimeOfDay } from "@/lib/loghouse/logHouseRoomTimeTheme";
import type { OnboardingFeature } from "@/lib/onboarding/onboardingStage";

type NavItem = {
  id: string;
  href: string;
  label: string;
};

type Props = {
  viewport: HomeForestSignViewport;
  navById: Record<string, NavItem>;
  primaryNavId: string;
  /** 本番 object-cover 表示時の座標変換 */
  coverLayout?: ObjectCoverLayout | null;
  /** 定規プレビュー用：リンクを無効化 */
  preview?: boolean;
  timeOfDay?: LogHouseRoomTimeOfDay;
};

const SIGN_SLOTS: HomeForestSignSignSlotId[] = [
  "sign-top-left",
  "sign-mid-left",
  "sign-top-right",
  "sign-bottom-right",
];

const signLinkClassDay = [
  "block rounded-sm",
  "underline-offset-[0.2em] decoration-[#9a826e]/55",
  "transition hover:underline hover:decoration-[#8a7563]",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b5d4a]",
  "[text-shadow:0_1px_0_rgba(255,251,245,0.65)]",
].join(" ");

const signLinkClassNight = [
  "block rounded-sm",
  "underline-offset-[0.2em] decoration-[#c4a882]/70",
  "transition hover:underline hover:decoration-[#d8c4a8]",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f0e2d0]",
  "[text-shadow:0_1px_1px_rgba(255,248,235,0.55)]",
].join(" ");

function withColor(
  placement: HomeForestSignTextPlacement,
  color: string,
): HomeForestSignTextPlacement {
  return { ...placement, color };
}

function placementStyle(
  placement: HomeForestSignTextPlacement,
  viewport: HomeForestSignViewport,
  coverLayout?: ObjectCoverLayout | null,
) {
  return homeForestSignPlacementStyle(placement, viewport, coverLayout);
}

function textAlignClass(placement: HomeForestSignTextPlacement): string {
  const align = placement.textAlign ?? (placement.textAnchor === "center" ? "center" : "left");
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
}

function ForestSignText({
  placement,
  viewport,
  coverLayout,
  children,
  className = "",
}: {
  placement: HomeForestSignTextPlacement;
  viewport: HomeForestSignViewport;
  coverLayout?: ObjectCoverLayout | null;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`pointer-events-none whitespace-pre-wrap ${className}`}
      style={placementStyle(placement, viewport, coverLayout)}
    >
      {children}
    </div>
  );
}

const FOREST_SIGN_NAV_FEATURES: Record<string, OnboardingFeature | null> = {
  loghouse: null,
  first: null,
  "forest-map": null,
  "ljd-help": null,
};

function ForestSignSignLink({
  placement,
  viewport,
  coverLayout,
  item,
  primary,
  preview = false,
  nowrap = false,
  timeOfDay = "day",
}: {
  placement: HomeForestSignTextPlacement;
  viewport: HomeForestSignViewport;
  coverLayout?: ObjectCoverLayout | null;
  item: NavItem;
  primary: boolean;
  preview?: boolean;
  nowrap?: boolean;
  timeOfDay?: LogHouseRoomTimeOfDay;
}) {
  const { ready, isFeatureUnlocked } = useOnboardingStage();
  const colors = homeForestSignTextColors(timeOfDay);
  const style = placementStyle(withColor(placement, colors.sign), viewport, coverLayout);
  const signLinkClass = timeOfDay === "night" ? signLinkClassNight : signLinkClassDay;
  const whitespaceClass = nowrap ? "whitespace-nowrap" : "whitespace-pre-wrap";
  const feature = FOREST_SIGN_NAV_FEATURES[item.id] ?? null;
  const unlocked = feature == null || isFeatureUnlocked(feature);
  const primaryDecoration =
    timeOfDay === "night" ? "font-bold decoration-[#c4a882]" : "font-bold decoration-[#8a7563]";

  if (preview) {
    return (
      <span
        className={`${signLinkClass} ${whitespaceClass} pointer-events-none ${primary ? "font-bold" : ""}`}
        style={style}
      >
        {item.label}
      </span>
    );
  }

  if (!ready && feature) {
    return (
      <span
        className={`${signLinkClass} ${whitespaceClass} pointer-events-none ${primary ? "font-bold" : ""}`}
        style={style}
        aria-busy="true"
      >
        {item.label}
      </span>
    );
  }

  if (!unlocked && feature) {
    return (
      <OnboardingLockedTap feature={feature} className="pointer-events-auto">
        <span
          className={`${signLinkClass} ${whitespaceClass} pointer-events-auto opacity-45 ${primary ? "font-bold" : ""}`}
          style={style}
        >
          {item.label}
        </span>
      </OnboardingLockedTap>
    );
  }

  return (
    <OwlNavButton
      href={item.href}
      loadingLabel={
        HOME_FOREST_SIGN_NAV_LOADING_LABELS[
          item.id as keyof typeof HOME_FOREST_SIGN_NAV_LOADING_LABELS
        ] ?? "ページを開いています…"
      }
      compactLoading
      className={`${signLinkClass} ${whitespaceClass} ${primary ? primaryDecoration : ""}`}
      style={style}
    >
      {item.label}
    </OwlNavButton>
  );
}

/** ログイン案内（看板オーバーレイより上のレイヤーに載せる） */
export function HomeForestSignLoginNote({
  viewport,
  coverLayout = null,
  preview = false,
  isLoggedIn = false,
  timeOfDay = "day",
}: {
  viewport: HomeForestSignViewport;
  coverLayout?: ObjectCoverLayout | null;
  preview?: boolean;
  isLoggedIn?: boolean;
  timeOfDay?: LogHouseRoomTimeOfDay;
}) {
  const layout = homeForestSignLayoutFor(viewport);
  const { heightPx } = homeForestSignDesignSize(viewport);
  const loginHref = buildLoginHref("/orders");
  const usePercentFont = !coverLayout;
  const colors = homeForestSignTextColors(timeOfDay);
  const loginShadow =
    timeOfDay === "night"
      ? "[text-shadow:0_1px_3px_rgba(8,12,18,0.9),0_0_2px_rgba(8,12,18,0.75)]"
      : "[text-shadow:0_1px_2px_rgba(255,251,245,0.95),0_0_1px_rgba(255,251,245,0.85)]";

  if (!layout.loginNote) return null;
  // ログイン済みは看板の「ログハウスへ」で入れるので、重複するログイン導線は出さない
  if (!preview && isLoggedIn) return null;

  return (
    <div
      className="pointer-events-none"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 19,
        ...(usePercentFont ? { fontSize: `${heightPx}px` } : {}),
      }}
    >
      <div
        className={`pointer-events-auto whitespace-pre-wrap text-center ${loginShadow}`}
        style={placementStyle(
          withColor(layout.loginNote, timeOfDay === "night" ? colors.soft : colors.sign),
          viewport,
          coverLayout,
        )}
      >
        {preview ? (
          <span className="text-[color:inherit]">{HOME_FOREST_SIGN_LOGIN_NOTE_PREVIEW_TEXT}</span>
        ) : (
          <OwlNavButton
            href={loginHref}
            loadingLabel={HOME_FOREST_SIGN_NAV_LOADING_LABELS.loginNote}
            compactLoading
            className="inline font-semibold text-[color:inherit] underline-offset-2 hover:underline"
          >
            {HOME_FOREST_SIGN_LOG_HOUSE_NOTE}
          </OwlNavButton>
        )}
      </div>
    </div>
  );
}

/** 案内板 PNG 上にタイトル・導線テキストを重ねる */
export function HomeForestSignOverlay({
  viewport,
  navById,
  primaryNavId,
  coverLayout = null,
  preview = false,
  timeOfDay = "day",
}: Props) {
  const layout = homeForestSignLayoutFor(viewport);
  const { widthPx, heightPx } = homeForestSignDesignSize(viewport);
  const usePercentFont = !coverLayout;
  const colors = homeForestSignTextColors(timeOfDay);
  const skyTextShadow =
    timeOfDay === "night"
      ? "[text-shadow:0_1px_4px_rgba(8,12,18,0.85),0_0_2px_rgba(8,12,18,0.7)]"
      : "[text-shadow:0_1px_0_rgba(255,251,245,0.45)]";
  const owlTeacherSrc =
    viewport === "mobile" ? HOME_HERO_OWL_TEACHER_SRC : HOME_FOREST_SIGN_OWL_TEACHER_SRC;

  return (
    <div
      className={preview ? "pointer-events-none" : ""}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 15,
        ...(usePercentFont ? { fontSize: `${heightPx}px` } : {}),
      }}
      aria-label="森の案内板"
    >
      <div
        className="pointer-events-none overflow-hidden"
        style={{
          ...homeForestSignImagePlacementStyle(
            layout.owlTeacher,
            viewport,
            coverLayout,
          ),
          zIndex: 2,
        }}
        aria-hidden
      >
        <Image
          src={owlTeacherSrc}
          alt=""
          width={682}
          height={1024}
          sizes={viewport === "mobile" ? "46vw" : "224px"}
          className={[
            "h-full w-full object-contain object-bottom transition-[filter,opacity] duration-700 ease-in-out",
            // 夜背景に対して昼用の明るいトーンを一段落とす
            timeOfDay === "night"
              ? "brightness-[0.72] contrast-[0.96] saturate-[0.88] opacity-[0.92]"
              : "brightness-100 opacity-100",
          ].join(" ")}
          priority
          unoptimized
        />
      </div>

      <ForestSignText
        placement={withColor(layout.title, colors.title)}
        viewport={viewport}
        coverLayout={coverLayout}
        className={skyTextShadow}
      >
        <h1
          className={`m-0 text-[length:inherit] font-[inherit] leading-[inherit] text-[color:inherit] ${textAlignClass(layout.title)}`}
        >
          {HOME_FOREST_SIGN_TITLE_TEXT}
        </h1>
      </ForestSignText>

      <ForestSignText
        placement={withColor(layout.subtitle, colors.subtitle)}
        viewport={viewport}
        coverLayout={coverLayout}
        className={skyTextShadow}
      >
        <p
          className={`m-0 text-[length:inherit] font-[inherit] leading-[inherit] text-[color:inherit] ${textAlignClass(layout.subtitle)}`}
        >
          {HOME_FOREST_SIGN_SUBTITLE_TEXT}
        </p>
      </ForestSignText>

      {SIGN_SLOTS.map((slotId) => {
        const navId = HOME_FOREST_SIGN_SLOT_NAV_IDS[slotId];
        const item = navById[navId];
        if (!item) return null;

        const placement =
          slotId === "sign-top-left"
            ? layout.signTopLeft
            : slotId === "sign-mid-left"
              ? layout.signMidLeft
              : slotId === "sign-top-right"
                ? layout.signTopRight
                : layout.signBottomRight;

        return (
          <ForestSignSignLink
            key={slotId}
            placement={placement}
            viewport={viewport}
            coverLayout={coverLayout}
            item={item}
            primary={navId === primaryNavId}
            preview={preview}
            nowrap={slotId === "sign-top-left" || slotId === "sign-mid-left"}
            timeOfDay={timeOfDay}
          />
        );
      })}

      <span className="sr-only">
        設計サイズ {widthPx}×{heightPx}
      </span>
    </div>
  );
}
