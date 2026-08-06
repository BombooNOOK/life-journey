import { beforeEach, describe, expect, it, vi } from "vitest";

const blobMap = new Map<string, Blob>();

vi.mock("@/lib/journal/moriLog/moriLogMediaBlobStore", () => ({
  putMoriLogMediaBlob: async (id: string, blob: Blob) => {
    blobMap.set(id, blob);
  },
  getMoriLogMediaBlob: async (id: string) => blobMap.get(id) ?? null,
  deleteMoriLogMediaBlobExactIds: async (ids: readonly string[]) => {
    for (const id of ids) blobMap.delete(id);
  },
}));

import {
  clearDeviceMovieDraft,
  DeviceMovieDraftReplaceRequiredError,
  deviceMovieDonguriPathForDraft,
  deviceMovieDraftMovieBlobId,
  deviceMovieDraftPosterBlobId,
  deviceMovieDraftResumePath,
  draftToComposeResult,
  getDeviceMovieDraft,
  isDeviceMovieDraftReplaceRequiredError,
  resolveDeviceMovieWorkflowStatus,
  saveDeviceMovieDraft,
} from "@/lib/journal/moriLog/deviceMovieDraft";

function sampleResult(bytes: number[]) {
  return {
    movieBlob: new Blob([new Uint8Array(bytes)], { type: "video/mp4" }),
    posterBlob: new Blob([new Uint8Array([9])], { type: "image/jpeg" }),
    mimeType: "video/mp4" as const,
    fileExtension: "mp4" as const,
    durationSec: 4.5,
    width: 720,
    height: 1280,
    audioMode: "mute" as const,
  };
}

describe("deviceMovieDraft", () => {
  beforeEach(async () => {
    blobMap.clear();
    await clearDeviceMovieDraft("prof-draft");
    await clearDeviceMovieDraft("prof-other");
  });

  it("saves one draft per profile with blobs and meta", async () => {
    const meta = await saveDeviceMovieDraft({
      profileId: "prof-draft",
      title: "下書きテスト",
      audioMode: "mute",
      result: sampleResult([1, 2, 3]),
    });
    expect(meta.title).toBe("下書きテスト");
    expect(meta.audioMode).toBe("mute");
    expect(meta.templateId).toBe("device_movie_basic");

    const loaded = await getDeviceMovieDraft("prof-draft");
    expect(loaded?.meta.id).toBe(meta.id);
    expect(loaded?.movieBlob.size).toBe(3);
    expect(loaded?.posterBlob.size).toBe(1);

    const composed = draftToComposeResult(loaded!);
    expect(composed.durationSec).toBe(4.5);
    expect(composed.audioMode).toBe("mute");
  });

  it("saves bgmId/bgmName for BGM drafts and restores them", async () => {
    const result = {
      ...sampleResult([7, 8, 9]),
      audioMode: "bgm" as const,
      bgmId: "projector001",
      bgmName: "映写機の曲 1",
    };
    const meta = await saveDeviceMovieDraft({
      profileId: "prof-draft",
      title: "BGM下書き",
      audioMode: "bgm",
      result,
    });
    expect(meta.audioMode).toBe("bgm");
    expect(meta.bgmId).toBe("projector001");
    expect(meta.bgmName).toBe("映写機の曲 1");

    const loaded = await getDeviceMovieDraft("prof-draft");
    const composed = draftToComposeResult(loaded!);
    expect(composed.audioMode).toBe("bgm");
    expect(composed.bgmId).toBe("projector001");
    expect(composed.bgmName).toBe("映写機の曲 1");
  });

  it("clears bgm fields when saving mute/original draft", async () => {
    await saveDeviceMovieDraft({
      profileId: "prof-draft",
      title: "once-bgm",
      audioMode: "bgm",
      result: {
        ...sampleResult([1]),
        audioMode: "bgm",
        bgmId: "projector002",
        bgmName: "映写機の曲 2",
      },
    });
    const muted = await saveDeviceMovieDraft({
      profileId: "prof-draft",
      title: "mute-now",
      audioMode: "mute",
      result: sampleResult([2, 3]),
      draftId: (await getDeviceMovieDraft("prof-draft"))!.meta.id,
    });
    expect(muted.audioMode).toBe("mute");
    expect(muted.bgmId).toBeNull();
    expect(muted.bgmName).toBeNull();
  });

  it("keeps same draft id when updating", async () => {
    const first = await saveDeviceMovieDraft({
      profileId: "prof-draft",
      title: "旧",
      audioMode: "original",
      result: sampleResult([1]),
    });
    const second = await saveDeviceMovieDraft({
      profileId: "prof-draft",
      title: "新",
      audioMode: "mute",
      result: sampleResult([3, 4]),
      draftId: first.id,
    });
    expect(second.id).toBe(first.id);
    const loaded = await getDeviceMovieDraft("prof-draft");
    expect(loaded?.meta.title).toBe("新");
    expect(loaded?.movieBlob.size).toBe(2);
  });

  it("rejects silent overwrite when another draft exists", async () => {
    const first = await saveDeviceMovieDraft({
      profileId: "prof-draft",
      title: "既存",
      audioMode: "original",
      result: sampleResult([1]),
    });
    await expect(
      saveDeviceMovieDraft({
        profileId: "prof-draft",
        title: "新しい下書き",
        audioMode: "mute",
        result: sampleResult([2, 3]),
      }),
    ).rejects.toBeInstanceOf(DeviceMovieDraftReplaceRequiredError);

    const still = await getDeviceMovieDraft("prof-draft");
    expect(still?.meta.id).toBe(first.id);
    expect(still?.meta.title).toBe("既存");
  });

  it("replaces existing draft only when replaceExisting is true and cleans old blobs", async () => {
    const first = await saveDeviceMovieDraft({
      profileId: "prof-draft",
      title: "旧下書き",
      audioMode: "original",
      result: sampleResult([1, 1]),
    });
    const oldMovieId = deviceMovieDraftMovieBlobId(first.id);
    const oldPosterId = deviceMovieDraftPosterBlobId(first.id);
    expect(blobMap.has(oldMovieId)).toBe(true);

    const second = await saveDeviceMovieDraft({
      profileId: "prof-draft",
      title: "新下書き",
      audioMode: "mute",
      result: sampleResult([7, 7, 7]),
      replaceExisting: true,
    });
    expect(second.id).not.toBe(first.id);
    expect(blobMap.has(oldMovieId)).toBe(false);
    expect(blobMap.has(oldPosterId)).toBe(false);
    expect(blobMap.has(deviceMovieDraftMovieBlobId(second.id))).toBe(true);

    const loaded = await getDeviceMovieDraft("prof-draft");
    expect(loaded?.meta.title).toBe("新下書き");
    expect(loaded?.movieBlob.size).toBe(3);
  });

  it("clears meta and blobs on delete", async () => {
    const meta = await saveDeviceMovieDraft({
      profileId: "prof-draft",
      title: "削除対象",
      audioMode: "mute",
      result: sampleResult([4]),
    });
    await clearDeviceMovieDraft("prof-draft");
    expect(await getDeviceMovieDraft("prof-draft")).toBeNull();
    expect(blobMap.has(deviceMovieDraftMovieBlobId(meta.id))).toBe(false);
    expect(blobMap.has(deviceMovieDraftPosterBlobId(meta.id))).toBe(false);
  });

  it("isolates drafts by profile", async () => {
    await saveDeviceMovieDraft({
      profileId: "prof-draft",
      title: "A",
      audioMode: "mute",
      result: sampleResult([1]),
    });
    await saveDeviceMovieDraft({
      profileId: "prof-other",
      title: "B",
      audioMode: "original",
      result: sampleResult([2, 2]),
    });
    expect((await getDeviceMovieDraft("prof-draft"))?.meta.title).toBe("A");
    expect((await getDeviceMovieDraft("prof-other"))?.meta.title).toBe("B");
  });

  it("distinguishes draft / billing_pending / confirmed workflow statuses", () => {
    expect(resolveDeviceMovieWorkflowStatus({ isLocalDraft: true })).toBe("draft");
    expect(
      resolveDeviceMovieWorkflowStatus({
        isLocalDraft: false,
        billingStatus: "pending",
      }),
    ).toBe("billing_pending");
    expect(
      resolveDeviceMovieWorkflowStatus({
        billingStatus: "confirmed",
      }),
    ).toBe("confirmed");
    expect(isDeviceMovieDraftReplaceRequiredError(new Error("no"))).toBe(false);
  });

  it("falls back decoration to lantern on draft without variant", async () => {
    const meta = await saveDeviceMovieDraft({
      profileId: "prof-draft",
      title: "旧下書き",
      audioMode: "mute",
      result: sampleResult([1]),
    });
    // 旧メタ相当: variant 無しの結果再開
    const loaded = await getDeviceMovieDraft("prof-draft");
    expect(loaded).not.toBeNull();
    const composed = draftToComposeResult({
      meta: { ...loaded!.meta, templateDecorationVariant: undefined },
      movieBlob: loaded!.movieBlob,
      posterBlob: loaded!.posterBlob,
    });
    expect(composed.templateDecorationVariant).toBe("lantern");
    expect(meta.id).toBeTruthy();
  });

  it("builds resume and donguri paths with draftId", () => {
    expect(deviceMovieDraftResumePath("abc")).toBe(
      "/orders/hitoyasumi?view=movie_compose&draftId=abc",
    );
    const donguri = deviceMovieDonguriPathForDraft("abc");
    expect(donguri).toContain("/orders/donguri?");
    expect(donguri).toContain("draftId=abc");
    expect(donguri).toContain("returnTo=");
  });
});
