import { afterEach, describe, expect, it } from "vitest";

import {
  applyLinearFadeOutToAudioBuffer,
  listDeviceMovieBgmTracks,
  resolveDeviceMovieBgmFadeOutSec,
  sliceAudioBuffer,
} from "@/lib/journal/moriLog/deviceMovieBgmAudio";
import { DEVICE_MOVIE_PROJECTOR_BGM_TRACKS } from "@/lib/journal/moriLog/deviceMovieProjectorBgmCatalog";
import { MORI_LOG_BGM_TRACKS } from "@/lib/journal/moriLog/moriLogBgmCatalog";

class FakeAudioBuffer {
  numberOfChannels: number;
  length: number;
  sampleRate: number;
  private channels: Float32Array[];

  constructor(channels: number, length: number, sampleRate: number) {
    this.numberOfChannels = channels;
    this.length = length;
    this.sampleRate = sampleRate;
    this.channels = Array.from({ length: channels }, () =>
      Float32Array.from({ length }, () => 1),
    );
  }

  getChannelData(ch: number) {
    return this.channels[ch]!;
  }

  copyToChannel(source: Float32Array, ch: number) {
    this.channels[ch]!.set(source.subarray(0, this.length));
  }
}

class FakeAudioContext {
  createBuffer(channels: number, length: number, sampleRate: number) {
    return new FakeAudioBuffer(channels, length, sampleRate) as unknown as AudioBuffer;
  }
  async close(): Promise<void> {
    return undefined;
  }
}

function installFakeAudioContext() {
  (globalThis as { AudioContext?: unknown; window?: unknown }).AudioContext =
    FakeAudioContext;
  (globalThis as { window?: unknown }).window = globalThis;
}

describe("deviceMovieBgmAudio", () => {
  afterEach(() => {
    delete (globalThis as { AudioContext?: unknown }).AudioContext;
  });

  it("lists projector tracks, not diary music-hall tracks", () => {
    const tracks = listDeviceMovieBgmTracks();
    expect(tracks).toEqual(DEVICE_MOVIE_PROJECTOR_BGM_TRACKS);
    expect(tracks).toHaveLength(3);
    expect(tracks.map((t) => t.id)).toEqual([
      "projector001",
      "projector002",
      "projector003",
    ]);
    expect(tracks.some((t) => MORI_LOG_BGM_TRACKS.some((d) => d.id === t.id))).toBe(
      false,
    );
  });

  it("fadeOutSec = min(0.5, duration * 0.15)", () => {
    expect(resolveDeviceMovieBgmFadeOutSec(10)).toBeCloseTo(0.5);
    expect(resolveDeviceMovieBgmFadeOutSec(3)).toBeCloseTo(0.45);
    expect(resolveDeviceMovieBgmFadeOutSec(1)).toBeCloseTo(0.15);
    expect(resolveDeviceMovieBgmFadeOutSec(0)).toBe(0);
  });

  it("slices from the start without padding", () => {
    installFakeAudioContext();
    const src = new FakeAudioBuffer(1, 48000, 48000) as unknown as AudioBuffer;
    const sliced = sliceAudioBuffer(src, 0.5);
    expect(sliced.length).toBe(24000);
    expect(sliced.getChannelData(0)[0]).toBe(1);
  });

  it("applies linear fade-out at the end", () => {
    installFakeAudioContext();
    const src = new FakeAudioBuffer(1, 1000, 1000) as unknown as AudioBuffer;
    const faded = applyLinearFadeOutToAudioBuffer(src, 0.1);
    expect(faded.getChannelData(0)[0]).toBe(1);
    expect(faded.getChannelData(0)[999]).toBeLessThan(0.05);
    expect(faded.getChannelData(0)[900]).toBeCloseTo(1, 5);
  });
});
