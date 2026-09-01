import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieStore = {
  get: vi.fn(),
};
const getViewerEmailFromCookie = vi.fn();
const getVerifiedViewerSession = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}));

vi.mock("@/lib/auth/viewer", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/viewer")>(
    "@/lib/auth/viewer",
  );
  return {
    ...actual,
    getViewerEmailFromCookie: (...args: unknown[]) => getViewerEmailFromCookie(...args),
  };
});

vi.mock("@/lib/auth/verifiedSession", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/verifiedSession")>(
    "@/lib/auth/verifiedSession",
  );
  return {
    ...actual,
    getVerifiedViewerSession: (...args: unknown[]) => getVerifiedViewerSession(...args),
  };
});

import {
  resolveIdentityShadowState,
  toPublicIdentityShadowReport,
} from "@/lib/auth/identityShadowState";

describe("resolveIdentityShadowState", () => {
  it("verified auth OFF → disabled", () => {
    expect(
      resolveIdentityShadowState({
        verifiedAuthEnabled: false,
        legacyEmail: "a@example.com",
        verifiedSession: { uid: "u1", email: "a@example.com" },
        verifiedSessionCookiePresent: true,
      }).state,
    ).toBe("disabled");
  });

  it("legacy + verified same email → match", () => {
    const r = resolveIdentityShadowState({
      verifiedAuthEnabled: true,
      legacyEmail: "user@example.com",
      verifiedSession: { uid: "uid-1", email: "user@example.com" },
      verifiedSessionCookiePresent: true,
    });
    expect(r.state).toBe("match");
    expect(r.verifiedUid).toBe("uid-1");
    expect(r.legacyEmailPresent).toBe(true);
    expect(r.verifiedSessionPresent).toBe(true);
  });

  it("case/whitespace differences still match", () => {
    expect(
      resolveIdentityShadowState({
        verifiedAuthEnabled: true,
        legacyEmail: "  Alice@Example.COM ",
        verifiedSession: { uid: "uid-1", email: "alice@example.com" },
        verifiedSessionCookiePresent: true,
      }).state,
    ).toBe("match");
  });

  it("legacy old + verified new → email_mismatch (not auto-remap)", () => {
    const r = resolveIdentityShadowState({
      verifiedAuthEnabled: true,
      legacyEmail: "old@example.com",
      verifiedSession: { uid: "uid-1", email: "new@example.com" },
      verifiedSessionCookiePresent: true,
    });
    expect(r.state).toBe("email_mismatch");
    expect(r.verifiedUid).toBe("uid-1");
  });

  it("legacy only → legacy_only", () => {
    expect(
      resolveIdentityShadowState({
        verifiedAuthEnabled: true,
        legacyEmail: "solo@example.com",
        verifiedSession: null,
        verifiedSessionCookiePresent: false,
      }).state,
    ).toBe("legacy_only");
  });

  it("verified only → verified_only", () => {
    const r = resolveIdentityShadowState({
      verifiedAuthEnabled: true,
      legacyEmail: null,
      verifiedSession: { uid: "uid-2", email: "v@example.com" },
      verifiedSessionCookiePresent: true,
    });
    expect(r.state).toBe("verified_only");
    expect(r.verifiedUid).toBe("uid-2");
  });

  it("neither → empty", () => {
    expect(
      resolveIdentityShadowState({
        verifiedAuthEnabled: true,
        legacyEmail: null,
        verifiedSession: null,
        verifiedSessionCookiePresent: false,
      }).state,
    ).toBe("empty");
  });

  it("invalid verified cookie → verified_invalid", () => {
    expect(
      resolveIdentityShadowState({
        verifiedAuthEnabled: true,
        legacyEmail: "a@example.com",
        verifiedSession: null,
        verifiedSessionCookiePresent: true,
      }).state,
    ).toBe("verified_invalid");
  });

  it("public report omits raw uid/email", () => {
    const report = toPublicIdentityShadowReport(
      resolveIdentityShadowState({
        verifiedAuthEnabled: true,
        legacyEmail: "secret@example.com",
        verifiedSession: { uid: "uid-secret", email: "secret@example.com" },
        verifiedSessionCookiePresent: true,
      }),
    );
    expect(report).toEqual({
      state: "match",
      legacyPresent: true,
      verifiedPresent: true,
    });
    expect(JSON.stringify(report)).not.toContain("secret@");
    expect(JSON.stringify(report)).not.toContain("uid-secret");
  });
});

describe("getViewerIdentityShadowState + identity-shadow route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.LJD_VERIFIED_AUTH_SESSION_ENABLED;
    cookieStore.get.mockReset();
    getViewerEmailFromCookie.mockReset();
    getVerifiedViewerSession.mockReset();
  });

  it("server helper: match from cookies only (no body/query)", async () => {
    process.env.LJD_VERIFIED_AUTH_SESSION_ENABLED = "YES";
    getViewerEmailFromCookie.mockResolvedValue("user@example.com");
    cookieStore.get.mockImplementation((name: string) =>
      name === "lj_session" ? { value: "sess" } : undefined,
    );
    getVerifiedViewerSession.mockResolvedValue({
      uid: "uid-1",
      email: "user@example.com",
    });

    const { getViewerIdentityShadowState } = await import(
      "@/lib/auth/getViewerIdentityShadowState"
    );
    const result = await getViewerIdentityShadowState();
    expect(result.state).toBe("match");
    expect(getVerifiedViewerSession).toHaveBeenCalled();
  });

  it("server helper: email_mismatch does not rewrite cookies", async () => {
    process.env.LJD_VERIFIED_AUTH_SESSION_ENABLED = "YES";
    getViewerEmailFromCookie.mockResolvedValue("old@example.com");
    cookieStore.get.mockReturnValue({ value: "sess" });
    getVerifiedViewerSession.mockResolvedValue({
      uid: "uid-1",
      email: "new@example.com",
    });

    const { getViewerIdentityShadowState } = await import(
      "@/lib/auth/getViewerIdentityShadowState"
    );
    const result = await getViewerIdentityShadowState();
    expect(result.state).toBe("email_mismatch");
    expect(cookieStore.get).toHaveBeenCalled();
    expect(cookieStore).not.toHaveProperty("set");
  });

  it("diagnostic GET: flag OFF → 503 disabled, no raw identity", async () => {
    const { GET } = await import("@/app/api/auth/session/identity-shadow/route");
    const res = await GET();
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.state).toBe("disabled");
    expect(json).not.toHaveProperty("uid");
    expect(json).not.toHaveProperty("email");
  });

  it("diagnostic GET: match response omits uid/email", async () => {
    process.env.LJD_VERIFIED_AUTH_SESSION_ENABLED = "YES";
    getViewerEmailFromCookie.mockResolvedValue("user@example.com");
    cookieStore.get.mockReturnValue({ value: "sess" });
    getVerifiedViewerSession.mockResolvedValue({
      uid: "uid-1",
      email: "user@example.com",
    });

    const { GET } = await import("@/app/api/auth/session/identity-shadow/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      code: "OK",
      state: "match",
      legacyPresent: true,
      verifiedPresent: true,
    });
    expect(JSON.stringify(json)).not.toContain("uid-1");
    expect(JSON.stringify(json)).not.toContain("user@example.com");
  });

  it("spoofed env-only call still uses cookie helpers (no body email path)", async () => {
    process.env.LJD_VERIFIED_AUTH_SESSION_ENABLED = "YES";
    getViewerEmailFromCookie.mockResolvedValue("cookie@example.com");
    cookieStore.get.mockReturnValue({ value: "sess" });
    getVerifiedViewerSession.mockResolvedValue({
      uid: "uid-1",
      email: "cookie@example.com",
    });

    const { getViewerIdentityShadowState } = await import(
      "@/lib/auth/getViewerIdentityShadowState"
    );
    const result = await getViewerIdentityShadowState({
      LJD_VERIFIED_AUTH_SESSION_ENABLED: "YES",
    });
    expect(result.state).toBe("match");
    expect(getViewerEmailFromCookie).toHaveBeenCalled();
  });
});
