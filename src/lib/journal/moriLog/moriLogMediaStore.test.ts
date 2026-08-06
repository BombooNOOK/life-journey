import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createLocalMoriLogMediaStore,
  normalizeMoriLogMediaRecord,
  resetMoriLogMediaStoreForTests,
} from "@/lib/journal/moriLog/moriLogMediaStore";
import type { MoriLogMediaCreateInput } from "@/lib/journal/moriLog/moriLogMedia";

function sample(partial?: Partial<MoriLogMediaCreateInput>): MoriLogMediaCreateInput {
  return {
    userId: "user@example.com",
    profileId: "prof1",
    entryId: "entry1",
    type: "card_image",
    templateId: "sns02",
    entryDateKey: "2026-07-24",
    tags: ["森", "散歩"],
    hashtags: [],
    outputFormat: "png",
    storage: "local",
    ...partial,
  };
}

describe("createLocalMoriLogMediaStore", () => {
  beforeEach(() => {
    resetMoriLogMediaStoreForTests();
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

  it("upserts and lists by profile / entry / month / tag / date", async () => {
    const store = createLocalMoriLogMediaStore();
    const a = await store.upsert(sample());
    await store.upsert(
      sample({
        entryId: "entry2",
        entryDateKey: "2026-06-01",
        tags: ["海"],
        templateId: "sns03",
      }),
    );

    expect(a.id).toBeTruthy();
    expect(await store.list({ profileId: "prof1" })).toHaveLength(2);
    expect(await store.list({ profileId: "prof1", entryId: "entry1" })).toHaveLength(1);
    expect(await store.list({ profileId: "prof1", monthKey: "2026-07" })).toHaveLength(1);
    expect(await store.list({ profileId: "prof1", tag: "森" })).toHaveLength(1);
    expect(await store.list({ profileId: "prof1", entryDateKey: "2026-07-24" })).toHaveLength(1);
    expect(await store.get(a.id, "prof1")).toMatchObject({
      templateId: "sns02",
      type: "card_image",
    });
  });

  it("removes by id", async () => {
    const store = createLocalMoriLogMediaStore();
    const a = await store.upsert(sample());
    await store.remove(a.id, "prof1");
    expect(await store.list({ profileId: "prof1" })).toHaveLength(0);
  });

  it("stores card_movie settings linked to a source card_image", async () => {
    const store = createLocalMoriLogMediaStore();
    const card = await store.upsert(
      sample({ type: "card_image", templateId: "kyou_no_ashiato" }),
    );
    const movie = await store.upsert(
      sample({
        type: "card_movie",
        templateId: card.templateId,
        sourceCardId: card.id,
        bgmId: "bgm-intro-video",
        durationSec: 6,
        outputFormat: "mp4",
      }),
    );

    expect(movie.type).toBe("card_movie");
    expect(movie.sourceCardId).toBe(card.id);
    expect(movie.bgmId).toBe("bgm-intro-video");
    expect(movie.durationSec).toBe(6);
    expect(await store.list({ profileId: "prof1", type: "card_movie" })).toHaveLength(1);
    expect(await store.list({ profileId: "prof1", type: "card_image" })).toHaveLength(1);
  });

  it("migrates legacy card/movie types from localStorage on read", async () => {
    const key = "ljd.moriLogMedia.v1:prof1";
    localStorage.setItem(
      key,
      JSON.stringify([
        {
          id: "legacy-card",
          userId: "u",
          profileId: "prof1",
          entryId: "e1",
          type: "card",
          templateId: "chiisana_ashiato",
          entryDateKey: "2026-07-01",
          tags: [],
          hashtags: [],
          outputFormat: "png",
          createdAt: "2026-07-01T00:00:00.000Z",
          storage: "local",
        },
        {
          id: "legacy-movie",
          userId: "u",
          profileId: "prof1",
          entryId: "e1",
          type: "movie",
          templateId: "chiisana_ashiato",
          sourceCardId: "legacy-card",
          bgmId: "bgm-1",
          entryDateKey: "2026-07-01",
          tags: [],
          hashtags: [],
          outputFormat: "mp4",
          createdAt: "2026-07-01T01:00:00.000Z",
          storage: "local",
        },
      ]),
    );

    const store = createLocalMoriLogMediaStore();
    const listed = await store.list({ profileId: "prof1" });
    expect(listed.map((item) => item.type).sort()).toEqual(["card_image", "card_movie"]);

    const rewritten = JSON.parse(localStorage.getItem(key) ?? "[]") as Array<{ type: string }>;
    expect(rewritten.map((item) => item.type).sort()).toEqual(["card_image", "card_movie"]);
  });
  it("stores device_video card_movie with null entryId", async () => {
    const store = createLocalMoriLogMediaStore();
    const movie = await store.upsert(
      sample({
        type: "card_movie",
        entryId: null,
        sourceOrigin: "device_video",
        templateId: "device_movie_basic",
        outputFormat: "mp4",
        bgmId: null,
        durationSec: 7,
        title: "森のひとこま",
      }),
    );
    expect(movie.entryId).toBeNull();
    expect(movie.sourceOrigin).toBe("device_video");
    expect(await store.list({ profileId: "prof1", type: "card_movie" })).toHaveLength(1);
    expect(await store.list({ profileId: "prof1", entryId: "entry1" })).toHaveLength(0);
  });
});

describe("normalizeMoriLogMediaRecord", () => {
  it("maps legacy type fields", () => {
    expect(
      normalizeMoriLogMediaRecord({
        id: "1",
        profileId: "p",
        entryId: "e",
        type: "card",
        templateId: "t",
        entryDateKey: "2026-01-01",
        tags: [],
        hashtags: [],
        createdAt: "2026-01-01T00:00:00.000Z",
      })?.type,
    ).toBe("card_image");
  });

  it("accepts null entryId and defaults sourceOrigin to diary", () => {
    const normalized = normalizeMoriLogMediaRecord({
      id: "dev-1",
      profileId: "p",
      entryId: null,
      type: "card_movie",
      templateId: "device_movie_basic",
      entryDateKey: "2026-08-05",
      tags: [],
      hashtags: [],
      createdAt: "2026-08-05T00:00:00.000Z",
    });
    expect(normalized).toMatchObject({
      entryId: null,
      sourceOrigin: "diary",
      type: "card_movie",
    });
  });

  it("keeps device_video sourceOrigin", () => {
    const normalized = normalizeMoriLogMediaRecord({
      id: "dev-2",
      profileId: "p",
      entryId: null,
      sourceOrigin: "device_video",
      billingStatus: "pending",
      type: "card_movie",
      templateId: "device_movie_basic",
      entryDateKey: "2026-08-05",
      tags: [],
      hashtags: [],
      createdAt: "2026-08-05T00:00:00.000Z",
    });
    expect(normalized?.sourceOrigin).toBe("device_video");
    expect(normalized?.billingStatus).toBe("pending");
  });

  it("defaults missing billingStatus to confirmed", () => {
    const normalized = normalizeMoriLogMediaRecord({
      id: "legacy-1",
      profileId: "p",
      entryId: "e",
      type: "card_image",
      templateId: "t",
      entryDateKey: "2026-01-01",
      tags: [],
      hashtags: [],
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    expect(normalized?.billingStatus).toBe("confirmed");
  });
});
