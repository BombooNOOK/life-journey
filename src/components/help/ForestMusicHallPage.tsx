import Link from "next/link";

import { ForestMusicHallTrackPlayer } from "@/components/help/ForestMusicHallTrackPlayer";
import { ForestBuildingIllustration } from "@/components/guide/first-visit/ForestBuildingIllustration";
import {
  FOREST_MUSIC_HALL_PAGE_DESCRIPTION,
  FOREST_MUSIC_HALL_PAGE_TITLE,
  FOREST_MUSIC_HALL_TRACKS,
  FOREST_MUSIC_HALL_TRACK_CATEGORIES,
  type ForestMusicHallTrackCategory,
} from "@/lib/help/forestMusicHallCatalog";
import type { ForestMusicHallBackLink } from "@/lib/help/forestMusicHallNav";

const CATEGORY_ORDER: ForestMusicHallTrackCategory[] = ["bgm", "nature"];

type Props = {
  backLink: ForestMusicHallBackLink;
};

/** 森の小さな音楽堂ページ本文 */
export function ForestMusicHallPage({ backLink }: Props) {
  return (
    <div className="home-read-scope space-y-6">
      <header className="space-y-4">
        <p>
          <Link
            href={backLink.href}
            className="text-sm text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline"
          >
            ← {backLink.label}
          </Link>
        </p>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              {FOREST_MUSIC_HALL_PAGE_TITLE}
            </h1>
            <p className="mt-2 text-sm leading-6 text-stone-600">{FOREST_MUSIC_HALL_PAGE_DESCRIPTION}</p>
          </div>
        </div>
        <ForestBuildingIllustration building="musicHall" alt="森の小さな音楽堂の建物" className="pt-1" />
      </header>

      {CATEGORY_ORDER.map((category) => {
        const tracks = FOREST_MUSIC_HALL_TRACKS.filter((track) => track.category === category);
        if (tracks.length === 0) return null;
        const meta = FOREST_MUSIC_HALL_TRACK_CATEGORIES[category];

        return (
          <section key={category} className="space-y-3" aria-labelledby={`music-hall-${category}`}>
            <div>
              <h2 id={`music-hall-${category}`} className="text-base font-semibold text-stone-900 sm:text-lg">
                {meta.title}
              </h2>
              <p className="mt-1 text-sm leading-6 text-stone-600">{meta.description}</p>
            </div>
            <ul className="space-y-2.5">
              {tracks.map((track) => (
                <li key={track.id}>
                  <ForestMusicHallTrackPlayer track={track} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <p className="rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-600">
        ログハウスのラジカセからも、この音楽堂へつながります。
      </p>
    </div>
  );
}
