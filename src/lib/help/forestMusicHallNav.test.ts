import { describe, expect, it } from "vitest";

import {
  buildForestMusicHallHref,
  resolveForestMusicHallBackLink,
} from "@/lib/help/forestMusicHallNav";

describe("buildForestMusicHallHref", () => {
  it("adds returnTo query", () => {
    expect(buildForestMusicHallHref("/orders")).toBe(
      "/help/music-hall?returnTo=%2Forders",
    );
  });

  it("rejects open redirects", () => {
    expect(buildForestMusicHallHref("//evil.example")).toBe("/help/music-hall");
  });
});

describe("resolveForestMusicHallBackLink", () => {
  it("returns loghouse back link from orders", () => {
    expect(resolveForestMusicHallBackLink("/orders")).toEqual({
      href: "/orders",
      label: "ログハウスへ戻る",
    });
  });

  it("falls back to guide station", () => {
    expect(resolveForestMusicHallBackLink(null)).toEqual({
      href: "/help/ljd",
      label: "森の案内所へ",
    });
  });
});
