import type { Metadata } from "next";

import { ForestMusicHallPage } from "@/components/help/ForestMusicHallPage";
import {
  FOREST_MUSIC_HALL_PAGE_DESCRIPTION,
  FOREST_MUSIC_HALL_PAGE_TITLE,
} from "@/lib/help/forestMusicHallCatalog";

export const metadata: Metadata = {
  title: FOREST_MUSIC_HALL_PAGE_TITLE,
  description: FOREST_MUSIC_HALL_PAGE_DESCRIPTION,
};

export default function HelpMusicHallRoutePage() {
  return <ForestMusicHallPage />;
}
