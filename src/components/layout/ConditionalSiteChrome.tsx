"use client";

import { usePathname } from "next/navigation";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

type Props = {
  children: React.ReactNode;
};

/** トップ玄関・第1・2幕はヘッダー・フッターなしの全画面表示 */
export function ConditionalSiteChrome({ children }: Props) {
  const pathname = usePathname();
  const isFullBleedEntrance =
    pathname === "/" ||
    pathname === "/guide/first/welcome" ||
    pathname === "/guide/first/about";

  if (isFullBleedEntrance) {
    return <div className="flex min-h-[100dvh] flex-col">{children}</div>;
  }

  return (
    <>
      <SiteHeader />
      <main className="lj-read-surface relative z-0 mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
      <SiteFooter />
    </>
  );
}
