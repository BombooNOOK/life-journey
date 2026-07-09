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
  type HomeForestSignSignSlotId,
  type HomeForestSignTextPlacement,
  type HomeForestSignViewport,
  type ObjectCoverLayout,
} from "@/lib/home/homeForestSignLayout";
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
  isLoggedIn: boolean;
  /** 本番 object-cover 表示時の座標変換 */
  coverLayout?: ObjectCoverLayout | null;
  /** 定規プレビュー用：リンクを無効化 */
  preview?: boolean;
};

const SIGN_SLOTS: HomeForestSignSignSlotId[] = [
  "sign-top-left",
  "sign-mid-left",
  "sign-top-right",
  "sign-bottom-right",
];

const signLinkClass = [
  "block rounded-sm",
  "underline-offset-[0.2em] decoration-[#9a826e]/55",
  "transition hover:underline hover:decoration-[#8a7563]",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6b5d4a]",
  "[text-shadow:0_1px_0_rgba(255,251,245,0.65)]",
].join(" ");

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
  loghouse: "forest_loghouse",
  first: null,
  companion: "forest_companion",
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
}: {
  placement: HomeForestSignTextPlacement;
  viewport: HomeForestSignViewport;
  coverLayout?: ObjectCoverLayout | null;
  item: NavItem;
  primary: boolean;
  preview?: boolean;
  nowrap?: boolean;
}) {
  const { isFeatureUnlocked } = useOnboardingStage();
  const style = placementStyle(placement, viewport, coverLayout);
  const whitespaceClass = nowrap ? "whitespace-nowrap" : "whitespace-pre-wrap";
  const feature = FOREST_SIGN_NAV_FEATURES[item.id] ?? null;
  const unlocked = feature == null || isFeatureUnlocked(feature);

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
      className={`${signLinkClass} ${whitespaceClass} ${primary ? "font-bold decoration-[#8a7563]" : ""}`}
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
}: {
  viewport: HomeForestSignViewport;
  coverLayout?: ObjectCoverLayout | null;
  preview?: boolean;
}) {
  const layout = homeForestSignLayoutFor(viewport);
  const { heightPx } = homeForestSignDesignSize(viewport);
  const loginHref = buildLoginHref("/orders");
  const usePercentFont = !coverLayout;

  if (!layout.loginNote) return null;

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
        className="pointer-events-auto whitespace-pre-wrap text-center [text-shadow:0_1px_2px_rgba(255,251,245,0.95),0_0_1px_rgba(255,251,245,0.85)]"
        style={placementStyle(layout.loginNote, viewport, coverLayout)}
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
  isLoggedIn,
  coverLayout = null,
  preview = false,
}: Props) {
  const layout = homeForestSignLayoutFor(viewport);
  const { widthPx, heightPx } = homeForestSignDesignSize(viewport);
  const usePercentFont = !coverLayout;
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
          className="h-full w-full object-contain object-bottom"
          priority
          unoptimized
        />
      </div>

      <ForestSignText placement={layout.title} viewport={viewport} coverLayout={coverLayout}>
        <h1
          className={`m-0 text-[length:inherit] font-[inherit] leading-[inherit] text-[color:inherit] ${textAlignClass(layout.title)}`}
        >
          {HOME_FOREST_SIGN_TITLE_TEXT}
        </h1>
      </ForestSignText>

      <ForestSignText placement={layout.subtitle} viewport={viewport} coverLayout={coverLayout}>
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
            nowrap={slotId === "sign-top-left"}
          />
        );
      })}

      <span className="sr-only">
        設計サイズ {widthPx}×{heightPx}
      </span>
    </div>
  );
}
