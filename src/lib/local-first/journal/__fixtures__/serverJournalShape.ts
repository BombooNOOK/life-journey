/**
 * Minimal ServerJournalEntryLike fixtures for unit tests only.
 * Never loaded from Neon / Blob / real accounts.
 */

import type { ServerJournalEntryLike } from "@/lib/local-first/journal/types";

export const SERVER_JOURNAL_SHAPE_FIXTURE: ServerJournalEntryLike = {
  id: "cuid_fixture_server_shape_0001",
  createdAt: "2026-08-10T02:15:00.000Z",
  updatedAt: "2026-08-10T02:15:00.000Z",
  email: "fixture@example.invalid",
  profileId: "fixture-profile",
  content: "雨があがったあと、森をすこし歩いた。葉っぱの匂いが近くて、足元の石がぬれていた。",
  mood: "calm",
  activity: "record_anyway",
  companionType: "owl",
  designTheme: "simple",
  contentFontMode: "standard",
  photoDataUrl: null,
  photoBlobUrl: "https://example.invalid/fixture/rain.png",
  photoBlobPathname: "fixture/rain.png",
  photoMimeType: "image/png",
  photoSizeBytes: 1024,
  photoStorageProvider: "fixture",
  generatedComment: null,
  includeInBook: true,
  dateKey: "2026-08-10",
  title: "雨あがりの森",
  tags: ["#雨", "#森"],
};
