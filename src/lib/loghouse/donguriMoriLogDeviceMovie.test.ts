import { describe, expect, it } from "vitest";

import {
  moriLogDeviceMovieIdempotencyKey,
  moriLogDeviceMoviePaidDateKey,
} from "@/lib/loghouse/donguriMoriLogDeviceMovie";
import {
  DONGURI_MORI_LOG_DEVICE_MOVIE_COST,
  DONGURI_MORI_LOG_DEVICE_MOVIE_FIRST_FREE_DATE_KEY,
  donguriReasonLabel,
} from "@/lib/loghouse/donguriTypes";

describe("moriLogDeviceMovie donguri keys", () => {
  it("builds stable idempotency keys (email normalized)", () => {
    expect(
      moriLogDeviceMovieIdempotencyKey("User@Example.com", "prof1", "media-abc"),
    ).toBe("mori-log-device-movie:user@example.com:prof1:media-abc");
  });

  it("builds paid dateKey from mediaId", () => {
    expect(moriLogDeviceMoviePaidDateKey("media-1")).toBe("media:media-1");
  });

  it("keeps first-free cost/date constants", () => {
    expect(DONGURI_MORI_LOG_DEVICE_MOVIE_COST).toBe(2);
    expect(DONGURI_MORI_LOG_DEVICE_MOVIE_FIRST_FREE_DATE_KEY).toBe("first");
    expect(donguriReasonLabel("mori_log_device_movie_first_free")).toBe(
      "森の映写便り（はじめて）",
    );
    expect(donguriReasonLabel("mori_log_device_movie_create")).toBe("森の映写便り");
  });
});
