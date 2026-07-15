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

/** スマホでヘッダー／底ナビを外す注文まわり没入ルート */
export function isOrdersImmersiveMobilePath(pathname: string | null): boolean {
  return isLogHouseImmersivePath(pathname) || isForestBookshelfImmersivePath(pathname);
}

/** 開発用プレビューもヘッダーなし全画面にする */
export function isLogHouseImmersivePreviewPath(pathname: string | null): boolean {
  return (
    pathname === "/preview/loghouse-room" ||
    pathname === "/preview/garden" ||
    pathname === "/preview/forest-bookshelf"
  );
}
