/**
 * Fictional ServerJournalEntryLike fixture for mapper → SQLite PoC.
 * Never loaded from Neon / Blob / real accounts.
 */

import type { ServerJournalEntryLike } from "@/lib/local-first/journal/types";

export const RAIN_FOREST_SERVER_FIXTURE: ServerJournalEntryLike = {
  id: "cuid_fixture_rain_forest_0001",
  createdAt: "2026-08-10T02:15:00.000Z",
  updatedAt: "2026-08-10T02:15:00.000Z",
  email: "fixture@example.invalid",
  profileId: "fixture-profile-poc",
  content:
    "今日は雨があがったあと、少しだけ森を歩いた。葉っぱの匂いが近くて、足元の石がまだぬれていた。",
  mood: "calm",
  activity: "record_anyway",
  companionType: "owl",
  designTheme: "simple",
  contentFontMode: "standard",
  photoDataUrl: null,
  photoBlobUrl: "https://example.invalid/fixture/rain-forest.png",
  photoBlobPathname: "fixture/rain-forest.png",
  photoMimeType: "image/png",
  photoSizeBytes: 24218,
  photoStorageProvider: "fixture",
  generatedComment: null,
  includeInBook: true,
  dateKey: "2026-08-10",
  title: "雨あがりの森",
  tags: ["#雨", "#森"],
};

/** Bundled asset used as the single PoC photo (repo-safe). */
export const RAIN_FOREST_SEED_ASSET_URL = "./assets/poc-seed-acorn.png";
