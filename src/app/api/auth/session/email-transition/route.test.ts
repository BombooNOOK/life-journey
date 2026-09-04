import { beforeEach, describe, expect, it, vi } from "vitest";

const runSameUidEmailTransition = vi.fn();

vi.mock("@/lib/auth/sameUidEmailTransition", () => ({
  runSameUidEmailTransition: (...args: unknown[]) => runSameUidEmailTransition(...args),
  toPublicSameUidEmailTransitionResponse: (result: { state: string }) => {
    switch (result.state) {
      case "transitioned":
        return { code: "ok", state: "transitioned", status: 200 };
      case "already_current":
        return { code: "ok", state: "already_current", status: 200 };
      case "old_email_mismatch":
        return { code: "old_email_mismatch", state: "old_email_mismatch", status: 409 };
      case "new_email_primary_conflict":
        return {
          code: "new_email_primary_conflict",
          state: "new_email_primary_conflict",
          status: 409,
        };
      case "stale_transition":
        return { code: "stale_transition", state: "stale_transition", status: 409 };
      case "ambiguous_identity_state":
        return {
          code: "ambiguous_identity_state",
          state: "ambiguous_identity_state",
          status: 409,
        };
      case "verified_session_required":
        return {
          code: "verified_session_required",
          state: "verified_session_required",
          status: 401,
        };
      case "invalid_request":
        return { code: "invalid_request", state: "invalid_request", status: 400 };
      default:
        return { code: "disabled", state: "disabled", status: 503 };
    }
  },
}));

vi.mock("@/lib/auth/identityBindingGate", () => ({
  isIdentityBindingEnabled: vi.fn(),
}));
vi.mock("@/lib/auth/verifiedAuthSessionGate", () => ({
  isVerifiedAuthSessionEnabled: vi.fn(),
}));
vi.mock("@/lib/auth/sameUidEmailTransitionGate", () => ({
  isSameUidEmailTransitionEnabled: vi.fn(),
}));

describe("POST /api/auth/session/email-transition", () => {
  beforeEach(async () => {
    runSameUidEmailTransition.mockReset();
    const binding = await import("@/lib/auth/identityBindingGate");
    const verified = await import("@/lib/auth/verifiedAuthSessionGate");
    const transition = await import("@/lib/auth/sameUidEmailTransitionGate");
    vi.mocked(binding.isIdentityBindingEnabled).mockReset();
    vi.mocked(verified.isVerifiedAuthSessionEnabled).mockReset();
    vi.mocked(transition.isSameUidEmailTransitionEnabled).mockReset();
  });

  async function enableGates(on: boolean) {
    const binding = await import("@/lib/auth/identityBindingGate");
    const verified = await import("@/lib/auth/verifiedAuthSessionGate");
    const transition = await import("@/lib/auth/sameUidEmailTransitionGate");
    vi.mocked(verified.isVerifiedAuthSessionEnabled).mockReturnValue(on);
    vi.mocked(binding.isIdentityBindingEnabled).mockReturnValue(on);
    vi.mocked(transition.isSameUidEmailTransitionEnabled).mockReturnValue(on);
  }

  it("returns disabled when transition gate OFF", async () => {
    await enableGates(false);
    const { POST } = await import("@/app/api/auth/session/email-transition/route");
    const res = await POST(
      new Request("http://localhost/api/auth/session/email-transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedPreviousEmail: "a@ljd.invalid" }),
      }),
    );
    expect(res.status).toBe(503);
    expect(runSameUidEmailTransition).not.toHaveBeenCalled();
  });

  it("ignores body.newEmail and uses expectedPreviousEmail only", async () => {
    await enableGates(true);
    runSameUidEmailTransition.mockResolvedValue({
      state: "transitioned",
      identityId: "secret",
    });
    const { POST } = await import("@/app/api/auth/session/email-transition/route");
    const res = await POST(
      new Request("http://localhost/api/auth/session/email-transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedPreviousEmail: "a@ljd.invalid",
          newEmail: "attacker@evil.com",
          email: "attacker@evil.com",
          uid: "spoof",
        }),
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ code: "ok", state: "transitioned" });
    expect(JSON.stringify(json)).not.toContain("secret");
    expect(runSameUidEmailTransition).toHaveBeenCalledWith({
      expectedPreviousEmail: "a@ljd.invalid",
    });
  });

  it("rejects missing expectedPreviousEmail", async () => {
    await enableGates(true);
    const { POST } = await import("@/app/api/auth/session/email-transition/route");
    const res = await POST(
      new Request("http://localhost/api/auth/session/email-transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: "b@ljd.invalid" }),
      }),
    );
    expect(res.status).toBe(400);
    expect(runSameUidEmailTransition).not.toHaveBeenCalled();
  });

  it("GET is 405", async () => {
    const { GET } = await import("@/app/api/auth/session/email-transition/route");
    const res = await GET();
    expect(res.status).toBe(405);
  });
});
