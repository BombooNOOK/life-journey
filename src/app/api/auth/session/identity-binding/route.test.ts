import { beforeEach, describe, expect, it, vi } from "vitest";

const ensureVerifiedAccountIdentity = vi.fn();

vi.mock("@/lib/auth/ensureVerifiedAccountIdentity", () => ({
  ensureVerifiedAccountIdentity: (...args: unknown[]) =>
    ensureVerifiedAccountIdentity(...args),
  toPublicIdentityBindingResponse: (result: { state: string }) => {
    switch (result.state) {
      case "created":
        return { code: "ok", state: "created", status: 200 };
      case "match":
        return { code: "ok", state: "match", status: 200 };
      case "email_mismatch":
        return { code: "review_required", state: "email_mismatch", status: 409 };
      case "incomplete_identity":
        return { code: "review_required", state: "incomplete_identity", status: 409 };
      case "needs_operator_review":
        return { code: "review_required", state: "needs_operator_review", status: 409 };
      case "verified_session_required":
        return {
          code: "verified_session_required",
          state: "verified_session_required",
          status: 401,
        };
      default:
        return { code: "disabled", state: "disabled", status: 503 };
    }
  },
}));

vi.mock("@/lib/auth/identityBindingGate", () => ({
  IDENTITY_BINDING_FLAG: "LJD_IDENTITY_BINDING_ENABLED",
  isIdentityBindingEnabled: vi.fn(),
}));

vi.mock("@/lib/auth/verifiedAuthSessionGate", () => ({
  VERIFIED_AUTH_SESSION_FLAG: "LJD_VERIFIED_AUTH_SESSION_ENABLED",
  isVerifiedAuthSessionEnabled: vi.fn(),
}));

describe("POST /api/auth/session/identity-binding", () => {
  beforeEach(async () => {
    ensureVerifiedAccountIdentity.mockReset();
    const bindingGate = await import("@/lib/auth/identityBindingGate");
    const verifiedGate = await import("@/lib/auth/verifiedAuthSessionGate");
    vi.mocked(bindingGate.isIdentityBindingEnabled).mockReset();
    vi.mocked(verifiedGate.isVerifiedAuthSessionEnabled).mockReset();
  });

  it("returns disabled when flags OFF and ignores spoofed body", async () => {
    const bindingGate = await import("@/lib/auth/identityBindingGate");
    const verifiedGate = await import("@/lib/auth/verifiedAuthSessionGate");
    vi.mocked(verifiedGate.isVerifiedAuthSessionEnabled).mockReturnValue(false);
    vi.mocked(bindingGate.isIdentityBindingEnabled).mockReturnValue(false);

    const { POST } = await import("@/app/api/auth/session/identity-binding/route");
    const res = await POST(
      new Request("http://localhost/api/auth/session/identity-binding", {
        method: "POST",
        body: JSON.stringify({ uid: "spoof", email: "spoof@evil.com" }),
      }),
    );
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({ code: "disabled", state: "disabled" });
    expect(ensureVerifiedAccountIdentity).not.toHaveBeenCalled();
  });

  it("ignores request body and returns safe created state", async () => {
    const bindingGate = await import("@/lib/auth/identityBindingGate");
    const verifiedGate = await import("@/lib/auth/verifiedAuthSessionGate");
    vi.mocked(verifiedGate.isVerifiedAuthSessionEnabled).mockReturnValue(true);
    vi.mocked(bindingGate.isIdentityBindingEnabled).mockReturnValue(true);
    ensureVerifiedAccountIdentity.mockResolvedValue({
      state: "created",
      identityId: "secret-identity",
    });

    const { POST } = await import("@/app/api/auth/session/identity-binding/route");
    const res = await POST(
      new Request("http://localhost/api/auth/session/identity-binding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: "spoof-uid", email: "attacker@evil.com" }),
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ code: "ok", state: "created" });
    expect(JSON.stringify(json)).not.toContain("secret-identity");
    expect(ensureVerifiedAccountIdentity).toHaveBeenCalledWith();
  });

  it("returns review_required for email_mismatch without PII", async () => {
    const bindingGate = await import("@/lib/auth/identityBindingGate");
    const verifiedGate = await import("@/lib/auth/verifiedAuthSessionGate");
    vi.mocked(verifiedGate.isVerifiedAuthSessionEnabled).mockReturnValue(true);
    vi.mocked(bindingGate.isIdentityBindingEnabled).mockReturnValue(true);
    ensureVerifiedAccountIdentity.mockResolvedValue({
      state: "email_mismatch",
      identityId: "secret-identity",
    });

    const { POST } = await import("@/app/api/auth/session/identity-binding/route");
    const res = await POST(
      new Request("http://localhost/api/auth/session/identity-binding", {
        method: "POST",
      }),
    );
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({
      code: "review_required",
      state: "email_mismatch",
    });
  });
});
