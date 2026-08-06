import { describe, expect, it } from "vitest";

import {
  collectHitoyasumiTags,
  collectHitoyasumiYears,
  filterHitoyasumiMedia,
  filterHitoyasumiMediaByTags,
  filterHitoyasumiMediaByYearMonth,
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
    expect(hitoyasumiMediaTypeLabel("card_movie", "diary")).toBe("ムービー");
    expect(hitoyasumiMediaTypeLabel("card_movie", "device_video")).toBe("森の映写機");
  });

  it("collects unique tags and filters by OR", () => {
    const items = [
      sample({ id: "1", type: "card_image", tags: ["#森", "散歩"] }),
      sample({ id: "2", type: "card_movie", tags: ["海"] }),
      sample({ id: "3", type: "card_image", tags: ["森"] }),
    ];
    expect(collectHitoyasumiTags(items)).toEqual(["海", "散歩", "森"]);
    expect(filterHitoyasumiMediaByTags(items, []).map((i) => i.id)).toEqual(["1", "2", "3"]);
    expect(filterHitoyasumiMediaByTags(items, ["森"]).map((i) => i.id)).toEqual(["1", "3"]);
    expect(filterHitoyasumiMediaByTags(items, ["海", "散歩"]).map((i) => i.id)).toEqual(["1", "2"]);
  });

  it("filters by ashiato entry year and optional month", () => {
    const items = [
      sample({ id: "1", type: "card_image", entryDateKey: "2026-07-10" }),
      sample({ id: "2", type: "card_movie", entryDateKey: "2026-03-01" }),
      sample({ id: "3", type: "card_image", entryDateKey: "2025-07-20" }),
    ];
    expect(collectHitoyasumiYears(items)).toEqual([2026, 2025]);
    expect(filterHitoyasumiMediaByYearMonth(items, null, null).map((i) => i.id)).toEqual([
      "1",
      "2",
      "3",
    ]);
    expect(filterHitoyasumiMediaByYearMonth(items, 2026, null).map((i) => i.id)).toEqual([
      "1",
      "2",
    ]);
    expect(filterHitoyasumiMediaByYearMonth(items, 2026, 7).map((i) => i.id)).toEqual(["1"]);
  });
});
