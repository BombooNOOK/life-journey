import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ComposeMoriLogDeviceMovieResult } from "@/lib/journal/moriLog/composeMoriLogDeviceMovieTypes";

const putPoster = vi.fn();
const putMovie = vi.fn();
const removeBlob = vi.fn();
const upsertMeta = vi.fn();
const removeMeta = vi.fn();

vi.mock("@/lib/journal/moriLog/moriLogMediaBlobStore", () => ({
  MORI_LOG_MEDIA_BLOB_URI: "idb:moriLogMediaBlob.v1",
  putMoriLogMediaPosterBlob: (...args: unknown[]) => putPoster(...args),
  putMoriLogMediaBlob: (...args: unknown[]) => putMovie(...args),
  removeMoriLogMediaBlob: (...args: unknown[]) => removeBlob(...args),
}));

vi.mock("@/lib/journal/moriLog/moriLogMediaStore", () => ({
  getMoriLogMediaStore: () => ({
    upsert: (...args: unknown[]) => upsertMeta(...args),
    remove: (...args: unknown[]) => removeMeta(...args),
  }),
}));

import { saveDeviceMovieToMoriLog } from "@/lib/journal/moriLog/saveDeviceMovieToMoriLog";

function sampleResult(): ComposeMoriLogDeviceMovieResult {
  return {
    movieBlob: new Blob([new Uint8Array([1, 2, 3])], { type: "video/mp4" }),
    posterBlob: new Blob([new Uint8Array([9])], { type: "image/jpeg" }),
    mimeType: "video/mp4",
    fileExtension: "mp4",
    durationSec: 5,
    width: 720,
    height: 1280,
    audioMode: "mute",
  };
}

describe("saveDeviceMovieToMoriLog cleanup", () => {
  beforeEach(() => {
    putPoster.mockReset();
    putMovie.mockReset();
    removeBlob.mockReset();
    upsertMeta.mockReset();
    removeMeta.mockReset();
    putPoster.mockResolvedValue(undefined);
    putMovie.mockResolvedValue(undefined);
    removeBlob.mockResolvedValue(undefined);
    removeMeta.mockResolvedValue(undefined);
  });

  it("removes blobs when meta upsert fails", async () => {
    upsertMeta.mockRejectedValue(new Error("meta fail"));
    await expect(
      saveDeviceMovieToMoriLog({
        profileId: "prof1",
        title: "テスト",
        result: sampleResult(),
      }),
    ).rejects.toThrow("meta fail");
    expect(putPoster).toHaveBeenCalledOnce();
    expect(putMovie).toHaveBeenCalledOnce();
    expect(removeBlob).toHaveBeenCalledOnce();
    expect(removeMeta).not.toHaveBeenCalled();
  });

  it("removes poster when movie blob put fails", async () => {
    putMovie.mockRejectedValue(new Error("movie fail"));
    await expect(
      saveDeviceMovieToMoriLog({
        profileId: "prof1",
        title: "テスト",
        result: sampleResult(),
      }),
    ).rejects.toThrow("movie fail");
    expect(putPoster).toHaveBeenCalledOnce();
    expect(upsertMeta).not.toHaveBeenCalled();
    expect(removeBlob).toHaveBeenCalledOnce();
  });
});
