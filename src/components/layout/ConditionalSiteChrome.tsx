"use client";

import { usePathname } from "next/navigation";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { isFirstVisitFullBleedPath } from "@/lib/onboarding/firstVisitWizard/routes";

type Props = {
  children: React.ReactNode;
};

/** トップ玄関・動画・ログハウス完成画面はヘッダー・フッターなしの全画面表示 */
export function ConditionalSiteChrome({ children }: Props) {
  const pathname = usePathname();
  const isFullBleedEntrance = pathname === "/" || isFirstVisitFullBleedPath(pathname);

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
