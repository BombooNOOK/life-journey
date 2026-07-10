import type { Metadata } from "next";

import { ForestMusicHallPage } from "@/components/help/ForestMusicHallPage";
import {
  FOREST_MUSIC_HALL_PAGE_DESCRIPTION,
  FOREST_MUSIC_HALL_PAGE_TITLE,
} from "@/lib/help/forestMusicHallCatalog";
import { resolveForestMusicHallBackLink } from "@/lib/help/forestMusicHallNav";

export const metadata: Metadata = {
  title: FOREST_MUSIC_HALL_PAGE_TITLE,
  description: FOREST_MUSIC_HALL_PAGE_DESCRIPTION,
};

type Props = {
  searchParams: Promise<{ returnTo?: string }>;
};

export default async function HelpMusicHallRoutePage({ searchParams }: Props) {
  const params = await searchParams;
  const backLink = resolveForestMusicHallBackLink(params.returnTo);

  return <ForestMusicHallPage backLink={backLink} />;
}
