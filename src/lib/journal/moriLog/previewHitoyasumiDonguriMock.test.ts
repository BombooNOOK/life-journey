import { describe, expect, it } from "vitest";

import {
  PREVIEW_HITOYASUMI_PROFILE_ID,
  shouldMockPreviewHitoyasumiDonguri,
} from "@/lib/journal/moriLog/previewHitoyasumiDonguriMock";

describe("shouldMockPreviewHitoyasumiDonguri", () => {
  it("enables only in development + preview profile + preview path", () => {
    expect(
      shouldMockPreviewHitoyasumiDonguri(PREVIEW_HITOYASUMI_PROFILE_ID, {
        nodeEnv: "development",
        pathname: "/preview/hitoyasumi",
      }),
    ).toBe(true);
    expect(
      shouldMockPreviewHitoyasumiDonguri(PREVIEW_HITOYASUMI_PROFILE_ID, {
        nodeEnv: "development",
        pathname: "/preview/hitoyasumi/extra",
      }),
    ).toBe(true);
  });

  it("never enables in production", () => {
    expect(
      shouldMockPreviewHitoyasumiDonguri(PREVIEW_HITOYASUMI_PROFILE_ID, {
        nodeEnv: "production",
        pathname: "/preview/hitoyasumi",
      }),
    ).toBe(false);
  });

  it("does not enable for other profiles or routes", () => {
    expect(
      shouldMockPreviewHitoyasumiDonguri("real-profile", {
        nodeEnv: "development",
        pathname: "/preview/hitoyasumi",
      }),
    ).toBe(false);
    expect(
      shouldMockPreviewHitoyasumiDonguri(PREVIEW_HITOYASUMI_PROFILE_ID, {
        nodeEnv: "development",
        pathname: "/orders/hitoyasumi",
      }),
    ).toBe(false);
    expect(
      shouldMockPreviewHitoyasumiDonguri(PREVIEW_HITOYASUMI_PROFILE_ID, {
        nodeEnv: "development",
        pathname: "/preview/mori-log-device-movie",
      }),
    ).toBe(false);
  });
});
