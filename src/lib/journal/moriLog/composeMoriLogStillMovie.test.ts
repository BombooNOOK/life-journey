import { describe, expect, it } from "vitest";

import {
  moriLogMovieExtensionForMime,
  MORI_LOG_MOVIE_MIME_CANDIDATES,
  pickMoriLogMovieMimeType,
} from "@/lib/journal/moriLog/composeMoriLogStillMovie";

describe("composeMoriLogStillMovie helpers", () => {
  it("maps mime to extension", () => {
    expect(moriLogMovieExtensionForMime("video/mp4")).toBe("mp4");
    expect(moriLogMovieExtensionForMime("video/webm;codecs=vp9")).toBe("webm");
  });

  it("lists preferred mime candidates with mp4 first", () => {
    expect(MORI_LOG_MOVIE_MIME_CANDIDATES[0]).toContain("mp4");
  });

  it("pickMoriLogMovieMimeType handles missing MediaRecorder", () => {
    if (typeof MediaRecorder === "undefined") {
      expect(pickMoriLogMovieMimeType()).toBeNull();
    }
  });
});
