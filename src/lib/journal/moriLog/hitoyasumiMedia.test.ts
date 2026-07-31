import { describe, expect, it } from "vitest";

import {
  filterHitoyasumiMedia,
  hitoyasumiMediaTypeLabel,
  isHitoyasumiBrowsableType,
} from "@/lib/journal/moriLog/hitoyasumiMedia";
import type { MoriLogMedia } from "@/lib/journal/moriLog/moriLogMedia";

function sample(partial: Partial<MoriLogMedia> & Pick<MoriLogMedia, "id" | "type">): MoriLogMedia {
  return {
    userId: "u",
    profileId: "p",
    entryId: "e",
    templateId: "chiisana_ashiato",
    entryDateKey: "2026-07-31",
    tags: [],
    hashtags: [],
    outputFormat: partial.type === "card_movie" ? "mp4" : "png",
    createdAt: "2026-07-31T00:00:00.000Z",
    storage: "local",
    ...partial,
  };
}

describe("hitoyasumiMedia", () => {
  it("browses only card_image and card_movie", () => {
    expect(isHitoyasumiBrowsableType("card_image")).toBe(true);
    expect(isHitoyasumiBrowsableType("card_movie")).toBe(true);
    expect(isHitoyasumiBrowsableType("video_memory")).toBe(false);
  });

  it("filters by type", () => {
    const items = [
      sample({ id: "1", type: "card_image" }),
      sample({ id: "2", type: "card_movie" }),
      sample({ id: "3", type: "video_memory" }),
    ];
    expect(filterHitoyasumiMedia(items, "all").map((i) => i.id)).toEqual(["1", "2"]);
    expect(filterHitoyasumiMedia(items, "card_image").map((i) => i.id)).toEqual(["1"]);
    expect(filterHitoyasumiMedia(items, "card_movie").map((i) => i.id)).toEqual(["2"]);
  });

  it("labels types for UI", () => {
    expect(hitoyasumiMediaTypeLabel("card_image")).toBe("カード");
    expect(hitoyasumiMediaTypeLabel("card_movie")).toBe("ムービー");
  });
});
