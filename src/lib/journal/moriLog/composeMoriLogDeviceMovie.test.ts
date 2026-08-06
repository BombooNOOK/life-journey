import { describe, expect, it } from "vitest";

import {
  MoriLogDeviceMovieError,
  resolveDeviceMovieCrop,
} from "@/lib/journal/moriLog/composeMoriLogDeviceMovie";
import {
  assertDeviceMovieSourceDuration,
  assertDeviceMovieSourceSize,
  resolveDeviceMovieOutputSize,
  resolveDeviceMovieTrim,
} from "@/lib/journal/moriLog/composeMoriLogDeviceMovieValidate";
import {
  MORI_LOG_DEVICE_MOVIE_MAX_SOURCE_BYTES,
  MORI_LOG_DEVICE_MOVIE_MAX_SOURCE_DURATION_SEC,
} from "@/lib/journal/moriLog/composeMoriLogDeviceMovieTypes";

describe("composeMoriLogDeviceMovieValidate", () => {
  it("rejects oversized and overlong sources before encode", () => {
    expect(() => assertDeviceMovieSourceSize(MORI_LOG_DEVICE_MOVIE_MAX_SOURCE_BYTES + 1)).toThrow(
      MoriLogDeviceMovieError,
    );
    try {
      assertDeviceMovieSourceSize(MORI_LOG_DEVICE_MOVIE_MAX_SOURCE_BYTES + 1);
    } catch (e) {
      expect(e).toBeInstanceOf(MoriLogDeviceMovieError);
      expect((e as MoriLogDeviceMovieError).code).toBe("SOURCE_TOO_LARGE");
    }

    try {
      assertDeviceMovieSourceDuration(MORI_LOG_DEVICE_MOVIE_MAX_SOURCE_DURATION_SEC + 0.1);
    } catch (e) {
      expect(e).toBeInstanceOf(MoriLogDeviceMovieError);
      expect((e as MoriLogDeviceMovieError).code).toBe("SOURCE_TOO_LONG");
    }

    try {
      assertDeviceMovieSourceDuration(2.9);
    } catch (e) {
      expect(e).toBeInstanceOf(MoriLogDeviceMovieError);
      expect((e as MoriLogDeviceMovieError).code).toBe("SOURCE_TOO_SHORT");
    }
  });

  it("uses whole short source without looping past end", () => {
    const trim = resolveDeviceMovieTrim({
      sourceDurationSec: 7,
      startSec: 0,
      durationSec: 10,
    });
    expect(trim.startSec).toBe(0);
    expect(trim.durationSec).toBeCloseTo(7, 5);
    expect(trim.endSec).toBeCloseTo(7, 5);
  });

  it("clips long sources to max 10s and clamps past-end starts", () => {
    const trim = resolveDeviceMovieTrim({
      sourceDurationSec: 40,
      startSec: 35,
      durationSec: 10,
    });
    expect(trim.endSec).toBeLessThanOrEqual(40);
    expect(trim.durationSec).toBeGreaterThanOrEqual(3);
    expect(trim.durationSec).toBeLessThanOrEqual(10);
    expect(trim.startSec + trim.durationSec).toBeCloseTo(trim.endSec, 5);
  });

  it("keeps even output sizes within max edge", () => {
    const size = resolveDeviceMovieOutputSize({
      displayWidth: 2160,
      displayHeight: 3840,
      maxEdge: 720,
    });
    expect(size.width % 2).toBe(0);
    expect(size.height % 2).toBe(0);
    expect(Math.max(size.width, size.height)).toBeLessThanOrEqual(720);
  });

  it("builds crop only when scale > 1", () => {
    expect(
      resolveDeviceMovieCrop({
        displayWidth: 1000,
        displayHeight: 1000,
        focusX: 0.5,
        focusY: 0.5,
        scale: 1,
      }),
    ).toBeUndefined();

    const crop = resolveDeviceMovieCrop({
      displayWidth: 1000,
      displayHeight: 800,
      focusX: 0.5,
      focusY: 0.5,
      scale: 2,
    });
    expect(crop).toEqual({ left: 250, top: 200, width: 500, height: 400 });
  });
});
