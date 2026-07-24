import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createLocalMoriLogMediaStore,
  resetMoriLogMediaStoreForTests,
} from "@/lib/journal/moriLog/moriLogMediaStore";
import type { MoriLogMediaCreateInput } from "@/lib/journal/moriLog/moriLogMedia";

function sample(partial?: Partial<MoriLogMediaCreateInput>): MoriLogMediaCreateInput {
  return {
    userId: "user@example.com",
    profileId: "prof1",
    entryId: "entry1",
    type: "card",
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
    expect(await store.get(a.id, "prof1")).toMatchObject({ templateId: "sns02", type: "card" });
  });

  it("removes by id", async () => {
    const store = createLocalMoriLogMediaStore();
    const a = await store.upsert(sample());
    await store.remove(a.id, "prof1");
    expect(await store.list({ profileId: "prof1" })).toHaveLength(0);
  });
});
