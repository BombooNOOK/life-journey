import { describe, expect, it } from "vitest";

import {
  getMoriLogBgmTrack,
  isMoriLogBgmId,
  MORI_LOG_BGM_TRACKS,
} from "@/lib/journal/moriLog/moriLogBgmCatalog";

describe("moriLogBgmCatalog", () => {
  it("lists music-hall BGM tracks only", () => {
    expect(MORI_LOG_BGM_TRACKS.length).toBeGreaterThan(0);
    expect(MORI_LOG_BGM_TRACKS.every((track) => track.category === "bgm")).toBe(true);
    expect(MORI_LOG_BGM_TRACKS.every((track) => track.src.startsWith("/audio/"))).toBe(true);
  });

  it("resolves known bgm ids", () => {
    const first = MORI_LOG_BGM_TRACKS[0]!;
    expect(isMoriLogBgmId(first.id)).toBe(true);
    expect(getMoriLogBgmTrack(first.id)?.title).toBe(first.title);
    expect(isMoriLogBgmId("not-a-track")).toBe(false);
    expect(getMoriLogBgmTrack(null)).toBeNull();
  });
});
