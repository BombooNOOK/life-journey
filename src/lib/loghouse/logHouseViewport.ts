"use client";

import { useLayoutEffect, useState } from "react";

/** ログハウス没入UIと同じブレークポイント（lg 未満＝スマホ） */
export const LOG_HOUSE_MOBILE_MAX_MQ = "(max-width: 1023px)" as const;

/** SSR 直後はスマホ想定（没入UIのチラつきを避ける） */
export function useIsLogHouseMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState(true);

  useLayoutEffect(() => {
    const mq = window.matchMedia(LOG_HOUSE_MOBILE_MAX_MQ);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isMobile;
}

export function isLogHouseImmersivePath(pathname: string | null): boolean {
  return pathname === "/orders" || pathname === "/orders/garden";
}

/** 森の本棚トップ（日記ブック詳細などは通常Chrome） */
export function isForestBookshelfImmersivePath(pathname: string | null): boolean {
  return pathname === "/orders/bookshelf";
}

const ORDERS_RESERVED_TOP_SEGMENTS = new Set([
  "bookshelf",
  "calendar",
  "list",
  "write",
  "garden",
  "settings",
  "account",
  "mailbox",
  "donguri",
  "kantei-hall",
  "support",
  "resident-card",
  "go-out",
  "profile",
  "plans",
]);

/** 今日の鑑定結果（`/orders/[orderId]`）。他の /orders/* 固定パスは除外 */
export function isDailyFortuneImmersivePath(pathname: string | null): boolean {
  if (!pathname) return false;
  const match = pathname.match(/^\/orders\/([^/]+)$/);
  if (!match) return false;
  const segment = match[1] ?? "";
  return segment.length > 0 && !ORDERS_RESERVED_TOP_SEGMENTS.has(segment);
}

/** スマホでヘッダー／底ナビを外す注文まわり没入ルート */
export function isOrdersImmersiveMobilePath(pathname: string | null): boolean {
  return (
    isLogHouseImmersivePath(pathname) ||
    isForestBookshelfImmersivePath(pathname) ||
    isDailyFortuneImmersivePath(pathname)
  );
}

/** 開発用プレビューもヘッダーなし全画面にする */
export function isLogHouseImmersivePreviewPath(pathname: string | null): boolean {
  return (
    pathname === "/preview/loghouse-room" ||
    pathname === "/preview/garden" ||
    pathname === "/preview/forest-bookshelf" ||
    pathname === "/preview/daily-fortune" ||
    pathname === "/preview/daily-fortune/layout" ||
    pathname === "/preview/mailbox" ||
    Boolean(pathname?.startsWith("/preview/mailbox/"))
  );
}
