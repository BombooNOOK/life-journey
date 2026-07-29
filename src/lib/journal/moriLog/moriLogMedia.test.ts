import { describe, expect, it } from "vitest";

import {
  buildMoriLogMovieCreateInput,
  MORI_LOG_MOVIE_DEFAULT_DURATION_SEC,
} from "@/lib/journal/moriLog/moriLogMedia";

describe("buildMoriLogMovieCreateInput", () => {
  it("builds a local movie metadata record", () => {
    const input = buildMoriLogMovieCreateInput({
      userId: "u1",
      profileId: "p1",
      entryId: "e1",
      templateId: "chiisana_ashiato",
      sourceCardId: "card-1",
      bgmId: "bgm-intro-video",
      entryDateKey: "2026-07-29",
      tags: ["森"],
      title: "モグ",
    });

    expect(input).toMatchObject({
      type: "movie",
      outputFormat: "mp4",
      storage: "local",
      sourceCardId: "card-1",
      bgmId: "bgm-intro-video",
      durationSec: MORI_LOG_MOVIE_DEFAULT_DURATION_SEC,
      templateId: "chiisana_ashiato",
      entryId: "e1",
    });
  });
});
