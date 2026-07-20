import type { Metadata } from "next";
import Link from "next/link";

import { DonguriStallPage } from "@/components/help/DonguriStallPage";
import {
  DONGURI_STALL_PAGE_DESCRIPTION,
  DONGURI_STALL_PAGE_PATH,
  DONGURI_STALL_PAGE_TITLE,
} from "@/lib/help/donguriStallCopy";
import { FOREST_MAP_PAGE_PATH } from "@/lib/help/forestMapAssets";
import { LOG_HOUSE_BACK_LINK } from "@/lib/journal/logHouseLabels";

export const metadata: Metadata = {
  title: DONGURI_STALL_PAGE_TITLE,
  description: DONGURI_STALL_PAGE_DESCRIPTION,
};

type Props = {
  searchParams: Promise<{ returnTo?: string }>;
};

function resolveBackLink(returnTo: string | undefined): { href: string; label: string } {
  if (returnTo === FOREST_MAP_PAGE_PATH || returnTo?.startsWith(`${FOREST_MAP_PAGE_PATH}?`)) {
    return { href: FOREST_MAP_PAGE_PATH, label: "森の案内図へ戻る" };
  }
  if (returnTo === "/help/ljd" || returnTo?.startsWith("/help/ljd?")) {
    return { href: "/help/ljd", label: "森の案内所へ戻る" };
  }
  if (returnTo === "/orders" || returnTo?.startsWith("/orders?")) {
    return LOG_HOUSE_BACK_LINK;
  }
  return { href: FOREST_MAP_PAGE_PATH, label: "森の案内図へ戻る" };
}

export default async function DonguriStallRoutePage({ searchParams }: Props) {
  const params = await searchParams;
  const backLink = resolveBackLink(params.returnTo);

  return (
    <main className="min-h-[100dvh] bg-[#f7f2ea]">
      <DonguriStallPage backLink={backLink} />
      <p className="sr-only">
        <Link href={DONGURI_STALL_PAGE_PATH}>{DONGURI_STALL_PAGE_TITLE}</Link>
      </p>
    </main>
  );
}
