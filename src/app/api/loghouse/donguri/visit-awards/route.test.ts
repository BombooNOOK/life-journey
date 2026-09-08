import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/viewer", () => ({
  getViewerEmailFromCookie: vi.fn(),
}));

vi.mock("@/lib/loghouse/donguriVisitAwards", () => ({
  runDonguriVisitAwardsForViewer: vi.fn(),
}));

describe("POST/GET /api/loghouse/donguri/visit-awards", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("GET returns 405 and never calls award runner", async () => {
    const { runDonguriVisitAwardsForViewer } = await import(
      "@/lib/loghouse/donguriVisitAwards"
    );
    const { GET } = await import("@/app/api/loghouse/donguri/visit-awards/route");
    const res = await GET();
    expect(res.status).toBe(405);
    expect(runDonguriVisitAwardsForViewer).not.toHaveBeenCalled();
  });

  it("POST without session returns 401", async () => {
    const { getViewerEmailFromCookie } = await import("@/lib/auth/viewer");
    vi.mocked(getViewerEmailFromCookie).mockResolvedValue(null);
    const { POST } = await import("@/app/api/loghouse/donguri/visit-awards/route");
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it("POST with session runs visit awards once", async () => {
    const { getViewerEmailFromCookie } = await import("@/lib/auth/viewer");
    const { runDonguriVisitAwardsForViewer } = await import(
      "@/lib/loghouse/donguriVisitAwards"
    );
    vi.mocked(getViewerEmailFromCookie).mockResolvedValue("x67.i36@ljd.invalid");
    vi.mocked(runDonguriVisitAwardsForViewer).mockResolvedValue({
      profileId: "p1",
      dailyDelivered: true,
      birthdayDelivered: false,
      cho: { balance: 1, todayDelivery: null, recent: [] },
    });
    const { POST } = await import("@/app/api/loghouse/donguri/visit-awards/route");
    const res = await POST();
    expect(res.status).toBe(200);
    expect(runDonguriVisitAwardsForViewer).toHaveBeenCalledTimes(1);
    expect(runDonguriVisitAwardsForViewer).toHaveBeenCalledWith({
      viewerEmail: "x67.i36@ljd.invalid",
    });
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.dailyDelivered).toBe(true);
  });
});
