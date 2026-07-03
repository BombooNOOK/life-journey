"use client";

import Image from "next/image";
import Link from "next/link";

import { buildLoginHref } from "@/app/login/loginFlow";
import { HOME_HERO_OWL_TEACHER_SRC } from "@/lib/home/homeHeroAssets";
import {
  HOME_FOREST_SIGN_LOGIN_NOTE_LINE,
  HOME_FOREST_SIGN_LOGIN_NOTE_LINK,
  HOME_FOREST_SIGN_LOGIN_NOTE_PREVIEW_TEXT,
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
  "absolute block whitespace-pre-wrap rounded-sm",
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
      className={`pointer-events-none absolute whitespace-pre-wrap ${className}`}
      style={placementStyle(placement, viewport, coverLayout)}
    >
      {children}
    </div>
  );
}

function ForestSignSignLink({
  placement,
  viewport,
  coverLayout,
  item,
  primary,
  preview = false,
}: {
  placement: HomeForestSignTextPlacement;
  viewport: HomeForestSignViewport;
  coverLayout?: ObjectCoverLayout | null;
  item: NavItem;
  primary: boolean;
  preview?: boolean;
}) {
  const style = placementStyle(placement, viewport, coverLayout);

  if (preview) {
    return (
      <span
        className={`${signLinkClass} pointer-events-none ${primary ? "font-bold" : ""}`}
        style={style}
      >
        {item.label}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      className={`${signLinkClass} ${primary ? "font-bold decoration-[#8a7563]" : ""}`}
      style={style}
    >
      {item.label}
    </Link>
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
  const loginHref = buildLoginHref("/orders");
  const usePercentFont = !coverLayout;

  return (
    <div
      className={`absolute inset-0 z-[1] ${preview ? "pointer-events-none" : ""}`}
      style={usePercentFont ? { fontSize: `${heightPx}px` } : undefined}
      aria-label="森の案内板"
    >
      <div
        className="pointer-events-none absolute"
        style={homeForestSignImagePlacementStyle(
          layout.owlTeacher,
          viewport,
          coverLayout,
        )}
        aria-hidden
      >
        <Image
          src={HOME_HERO_OWL_TEACHER_SRC}
          alt=""
          width={682}
          height={1024}
          sizes={viewport === "mobile" ? "46vw" : "224px"}
          className="h-full w-full object-contain object-bottom"
          priority
        />
      </div>

      <ForestSignText placement={layout.title} viewport={viewport} coverLayout={coverLayout}>
        <h1 className="m-0 text-center text-[length:inherit] font-[inherit] leading-[inherit] text-[color:inherit]">
          {HOME_FOREST_SIGN_TITLE_TEXT}
        </h1>
      </ForestSignText>

      <ForestSignText placement={layout.subtitle} viewport={viewport} coverLayout={coverLayout}>
        <p className="m-0 text-center text-[length:inherit] font-[inherit] leading-[inherit] text-[color:inherit]">
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
          />
        );
      })}

      {!isLoggedIn && layout.loginNote ? (
        <div
          className="pointer-events-auto absolute z-[3] whitespace-pre-wrap text-center [text-shadow:0_1px_0_rgba(255,251,245,0.75)]"
          style={placementStyle(layout.loginNote, viewport, coverLayout)}
        >
          {preview ? (
            <span className="text-[color:inherit]">{HOME_FOREST_SIGN_LOGIN_NOTE_PREVIEW_TEXT}</span>
          ) : (
            <>
              <span className="text-[color:inherit]">{HOME_FOREST_SIGN_LOGIN_NOTE_LINE}</span>
              <br />
              <Link
                href={loginHref}
                className="font-semibold text-[color:inherit] underline-offset-2 hover:underline"
              >
                {HOME_FOREST_SIGN_LOGIN_NOTE_LINK}
              </Link>
            </>
          )}
        </div>
      ) : null}

      <span className="sr-only">
        設計サイズ {widthPx}×{heightPx}
      </span>
    </div>
  );
}
