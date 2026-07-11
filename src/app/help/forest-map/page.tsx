import type { Metadata } from "next";

import { ForestMapPage } from "@/components/help/ForestMapPage";
import {
  FOREST_MAP_PAGE_DESCRIPTION,
  FOREST_MAP_PAGE_TITLE,
} from "@/lib/help/forestMapAssets";
import { resolveForestMapBackLink } from "@/lib/help/forestMapNav";

export const metadata: Metadata = {
  title: FOREST_MAP_PAGE_TITLE,
  description: FOREST_MAP_PAGE_DESCRIPTION,
};

type Props = {
  searchParams: Promise<{ returnTo?: string }>;
};

export default async function HelpForestMapRoutePage({ searchParams }: Props) {
  const params = await searchParams;
  const backLink = resolveForestMapBackLink(params.returnTo);

  return <ForestMapPage backLink={backLink} />;
}
