import { describe, expect, it } from "vitest";

import {
  buildMoriLogCardImageCreateInput,
  buildMoriLogDeviceMovieCreateInput,
  buildMoriLogMovieCreateInput,
  MORI_LOG_MOVIE_3KOMA_DURATION_SEC,
  MORI_LOG_MOVIE_DEFAULT_DURATION_SEC,
  moriLogMovieDurationSecForTemplate,
  normalizeMoriLogMediaType,
  resolveMoriLogMediaBillingStatus,
  resolveMoriLogMediaSourceOrigin,
} from "@/lib/journal/moriLog/moriLogMedia";

describe("normalizeMoriLogMediaType", () => {
  it("keeps current types and maps legacy card/movie", () => {
    expect(normalizeMoriLogMediaType("card_image")).toBe("card_image");
    expect(normalizeMoriLogMediaType("card_movie")).toBe("card_movie");
    expect(normalizeMoriLogMediaType("video_memory")).toBe("video_memory");
    expect(normalizeMoriLogMediaType("card")).toBe("card_image");
    expect(normalizeMoriLogMediaType("movie")).toBe("card_movie");
    expect(normalizeMoriLogMediaType("other")).toBeNull();
  });
});

describe("buildMoriLogCardImageCreateInput", () => {
  it("builds a local card_image metadata record", () => {
    const input = buildMoriLogCardImageCreateInput({
      userId: "u1",
      profileId: "p1",
      entryId: "e1",
      templateId: "chiisana_ashiato",
      entryDateKey: "2026-07-31",
      tags: ["森"],
      title: "モグ",
    });

    expect(input).toMatchObject({
      type: "card_image",
      outputFormat: "png",
      storage: "local",
      templateId: "chiisana_ashiato",
      entryId: "e1",
    });
  });
});

describe("buildMoriLogMovieCreateInput", () => {
  it("builds a local card_movie metadata record", () => {
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
      type: "card_movie",
      outputFormat: "mp4",
      storage: "local",
      sourceCardId: "card-1",
      bgmId: "bgm-intro-video",
      durationSec: MORI_LOG_MOVIE_DEFAULT_DURATION_SEC,
      templateId: "chiisana_ashiato",
      entryId: "e1",
      sourceOrigin: "diary",
      billingStatus: "confirmed",
    });
  });
});

describe("buildMoriLogDeviceMovieCreateInput", () => {
  it("builds device_video card_movie with null entryId", () => {
    const input = buildMoriLogDeviceMovieCreateInput({
      profileId: "p1",
      templateId: "device_movie_basic",
      entryDateKey: "2026-08-05",
      title: "森のひとこま",
      durationSec: 8,
    });
    expect(input).toMatchObject({
      type: "card_movie",
      sourceOrigin: "device_video",
      entryId: null,
      billingStatus: "pending",
      templateId: "device_movie_basic",
      bgmId: null,
      durationSec: 8,
    });
  });
});

describe("resolveMoriLogMediaSourceOrigin", () => {
  it("defaults missing values to diary", () => {
    expect(resolveMoriLogMediaSourceOrigin(undefined)).toBe("diary");
    expect(resolveMoriLogMediaSourceOrigin("device_video")).toBe("device_video");
    expect(resolveMoriLogMediaSourceOrigin("other")).toBe("diary");
  });
});

describe("resolveMoriLogMediaBillingStatus", () => {
  it("defaults missing values to confirmed", () => {
    expect(resolveMoriLogMediaBillingStatus(undefined)).toBe("confirmed");
    expect(resolveMoriLogMediaBillingStatus("pending")).toBe("pending");
    expect(resolveMoriLogMediaBillingStatus("confirmed")).toBe("confirmed");
  });
});

describe("moriLogMovieDurationSecForTemplate", () => {
  it("uses a longer duration for 3koma", () => {
    expect(moriLogMovieDurationSecForTemplate("kyou_no_3koma_ashiato")).toBe(
      MORI_LOG_MOVIE_3KOMA_DURATION_SEC,
    );
    expect(moriLogMovieDurationSecForTemplate("chiisana_ashiato")).toBe(
      MORI_LOG_MOVIE_DEFAULT_DURATION_SEC,
    );
  });
});
