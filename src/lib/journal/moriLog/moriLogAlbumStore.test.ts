import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createLocalMoriLogAlbumStore,
  resetMoriLogAlbumStoreForTests,
} from "@/lib/journal/moriLog/moriLogAlbumStore";

describe("createLocalMoriLogAlbumStore", () => {
  beforeEach(() => {
    resetMoriLogAlbumStoreForTests();
    const map = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => {
        map.set(key, value);
      },
      removeItem: (key: string) => {
        map.delete(key);
      },
      clear: () => map.clear(),
    });
  });

  it("upserts and lists by profile", async () => {
    const store = createLocalMoriLogAlbumStore();
    const a = await store.upsert({
      profileId: "prof1",
      title: "春の森",
      mediaIds: ["m1", "m2"],
      coverMediaId: "m1",
      coverType: "card_image",
    });
    await store.upsert({
      profileId: "prof1",
      title: "夏のムービー",
      mediaIds: ["m3"],
      coverMediaId: "m3",
      coverType: "card_movie",
    });

    expect(a.id).toBeTruthy();
    expect(await store.list("prof1")).toHaveLength(2);
    expect(await store.list("other")).toHaveLength(0);
    expect(await store.get(a.id, "prof1")).toMatchObject({
      title: "春の森",
      coverType: "card_image",
      mediaIds: ["m1", "m2"],
    });
  });

  it("removes by id", async () => {
    const store = createLocalMoriLogAlbumStore();
    const a = await store.upsert({
      profileId: "prof1",
      title: "消す",
      mediaIds: ["m1"],
      coverMediaId: "m1",
      coverType: "card_movie",
    });
    await store.remove(a.id, "prof1");
    expect(await store.list("prof1")).toHaveLength(0);
  });
});
