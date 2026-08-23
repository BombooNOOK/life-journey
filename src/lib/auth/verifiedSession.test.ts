import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyIdToken = vi.fn();
const createSessionCookie = vi.fn();
const verifySessionCookie = vi.fn();
const getAuth = vi.fn(() => ({
  verifyIdToken,
  createSessionCookie,
  verifySessionCookie,
}));
const initializeApp = vi.fn(() => ({ name: "test-app" }));
const getApps = vi.fn(() => []);

vi.mock("firebase-admin/app", () => ({
  cert: vi.fn((value: unknown) => value),
  getApps,
  initializeApp,
}));

vi.mock("firebase-admin/auth", () => ({
  getAuth,
}));

const cookieStore = {
  get: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}));

function enableAdminEnv() {
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({
    project_id: "demo",
    client_email: "demo@demo.iam.gserviceaccount.com",
    private_key: "-----BEGIN PRIVATE KEY-----\\ntest\\n-----END PRIVATE KEY-----\\n",
  });
}

describe("buildFirebaseActorKey", () => {
  it("builds firebase:<uid> deterministically without rewriting uid", async () => {
    const { buildFirebaseActorKey, isFirebaseActorKey } = await import(
      "@/lib/auth/firebaseActorKey"
    );
    expect(buildFirebaseActorKey("AbC123")).toBe("firebase:AbC123");
    expect(buildFirebaseActorKey("AbC123")).toBe("firebase:AbC123");
    expect(isFirebaseActorKey("firebase:AbC123")).toBe(true);
    expect(isFirebaseActorKey("user@example.com")).toBe(false);
  });

  it("rejects empty uid", async () => {
    const { buildFirebaseActorKey } = await import("@/lib/auth/firebaseActorKey");
    expect(() => buildFirebaseActorKey("")).toThrow("firebase_actor_key_uid_required");
  });
});

describe("verified auth session gate", () => {
  it("defaults OFF", async () => {
    const { isVerifiedAuthSessionEnabled } = await import(
      "@/lib/auth/verifiedAuthSessionGate"
    );
    expect(isVerifiedAuthSessionEnabled({})).toBe(false);
    expect(isVerifiedAuthSessionEnabled({ LJD_VERIFIED_AUTH_SESSION_ENABLED: "YES" })).toBe(
      true,
    );
    expect(isVerifiedAuthSessionEnabled({ LJD_VERIFIED_AUTH_SESSION_ENABLED: "1" })).toBe(true);
  });
});

describe("verified session helpers", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    delete process.env.LJD_VERIFIED_AUTH_SESSION_ENABLED;
    getApps.mockReturnValue([]);
    cookieStore.get.mockReset();
  });

  it("extractBearerToken parses Authorization header", async () => {
    const { extractBearerToken } = await import("@/lib/auth/verifiedSession");
    expect(extractBearerToken("Bearer tok-abc")).toBe("tok-abc");
    expect(extractBearerToken("bearer tok-abc")).toBe("tok-abc");
    expect(extractBearerToken("Basic x")).toBeNull();
    expect(extractBearerToken(null)).toBeNull();
  });

  it("cookie options are HttpOnly + SameSite=Lax; Secure in production", async () => {
    const { buildLjSessionCookieOptions } = await import("@/lib/auth/verifiedSession");
    const prod = buildLjSessionCookieOptions(100, { NODE_ENV: "production" });
    expect(prod.httpOnly).toBe(true);
    expect(prod.sameSite).toBe("lax");
    expect(prod.path).toBe("/");
    expect(prod.secure).toBe(true);
    expect(prod.maxAge).toBe(100);

    const dev = buildLjSessionCookieOptions(100, { NODE_ENV: "development" });
    expect(dev.secure).toBe(false);
    expect(dev.httpOnly).toBe(true);
  });

  it("verifyIdTokenClaims returns uid + normalized email", async () => {
    enableAdminEnv();
    verifyIdToken.mockResolvedValue({
      uid: "uid-1",
      email: "Alice@Example.COM",
      email_verified: true,
    });
    const { verifyIdTokenClaims } = await import("@/lib/auth/verifiedSession");
    await expect(verifyIdTokenClaims("good-token")).resolves.toEqual({
      uid: "uid-1",
      email: "alice@example.com",
      emailVerified: true,
    });
  });

  it("verifyIdTokenClaims fail-closes on email-less claims", async () => {
    enableAdminEnv();
    verifyIdToken.mockResolvedValue({ uid: "uid-1" });
    const { verifyIdTokenClaims, VerifiedSessionError } = await import(
      "@/lib/auth/verifiedSession"
    );
    await expect(verifyIdTokenClaims("tok")).rejects.toBeInstanceOf(VerifiedSessionError);
    await expect(verifyIdTokenClaims("tok")).rejects.toMatchObject({
      code: "id_token_email_required",
      status: 401,
    });
  });

  it("verifyIdTokenClaims fail-closes on invalid token", async () => {
    enableAdminEnv();
    verifyIdToken.mockRejectedValue(new Error("bad"));
    const { verifyIdTokenClaims } = await import("@/lib/auth/verifiedSession");
    await expect(verifyIdTokenClaims("bad")).rejects.toMatchObject({
      code: "invalid_id_token",
      status: 401,
    });
  });

  it("createVerifiedSessionCookie uses Firebase createSessionCookie", async () => {
    enableAdminEnv();
    verifyIdToken.mockResolvedValue({
      uid: "uid-9",
      email: "u@example.com",
      email_verified: false,
    });
    createSessionCookie.mockResolvedValue("session-cookie-value");
    const { createVerifiedSessionCookie } = await import("@/lib/auth/verifiedSession");
    const { LJ_SESSION_EXPIRES_IN_MS } = await import("@/lib/auth/verifiedSessionConstants");
    const result = await createVerifiedSessionCookie("id-token");
    expect(createSessionCookie).toHaveBeenCalledWith("id-token", {
      expiresIn: LJ_SESSION_EXPIRES_IN_MS,
    });
    expect(result.sessionCookie).toBe("session-cookie-value");
    expect(result.claims.uid).toBe("uid-9");
    expect(result.claims.email).toBe("u@example.com");
  });

  it("getVerifiedViewerSession reads lj_session only (no lj_user_email fallback)", async () => {
    enableAdminEnv();
    cookieStore.get.mockImplementation((name: string) => {
      if (name === "lj_session") return { value: "sess" };
      if (name === "lj_user_email") return { value: encodeURIComponent("spoof@evil.com") };
      return undefined;
    });
    verifySessionCookie.mockResolvedValue({
      uid: "uid-real",
      email: "real@example.com",
      email_verified: true,
    });
    const { getVerifiedViewerSession } = await import("@/lib/auth/verifiedSession");
    await expect(getVerifiedViewerSession()).resolves.toEqual({
      uid: "uid-real",
      email: "real@example.com",
      emailVerified: true,
    });
    expect(verifySessionCookie).toHaveBeenCalledWith("sess", false);
  });

  it("getVerifiedViewerSession returns null for invalid/expired session", async () => {
    enableAdminEnv();
    cookieStore.get.mockReturnValue({ value: "expired" });
    verifySessionCookie.mockRejectedValue(new Error("expired"));
    const { getVerifiedViewerSession } = await import("@/lib/auth/verifiedSession");
    await expect(getVerifiedViewerSession()).resolves.toBeNull();
  });

  it("getVerifiedViewerSession returns null when cookie absent", async () => {
    enableAdminEnv();
    cookieStore.get.mockReturnValue(undefined);
    const { getVerifiedViewerSession } = await import("@/lib/auth/verifiedSession");
    await expect(getVerifiedViewerSession()).resolves.toBeNull();
    expect(verifySessionCookie).not.toHaveBeenCalled();
  });
});

describe("/api/auth/session/verified route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    delete process.env.LJD_VERIFIED_AUTH_SESSION_ENABLED;
    getApps.mockReturnValue([]);
    cookieStore.get.mockReset();
  });

  it("flag OFF → 503 unavailable", async () => {
    const { POST } = await import("@/app/api/auth/session/verified/route");
    const res = await POST(
      new Request("http://localhost/api/auth/session/verified", {
        method: "POST",
        headers: { Authorization: "Bearer tok" },
      }),
    );
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.code).toBe("VERIFIED_AUTH_DISABLED");
  });

  it("missing bearer → 401", async () => {
    process.env.LJD_VERIFIED_AUTH_SESSION_ENABLED = "YES";
    enableAdminEnv();
    const { POST } = await import("@/app/api/auth/session/verified/route");
    const res = await POST(
      new Request("http://localhost/api/auth/session/verified", { method: "POST" }),
    );
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe("MISSING_BEARER");
  });

  it("invalid token → 401", async () => {
    process.env.LJD_VERIFIED_AUTH_SESSION_ENABLED = "YES";
    enableAdminEnv();
    verifyIdToken.mockRejectedValue(new Error("nope"));
    const { POST } = await import("@/app/api/auth/session/verified/route");
    const res = await POST(
      new Request("http://localhost/api/auth/session/verified", {
        method: "POST",
        headers: { Authorization: "Bearer bad" },
      }),
    );
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe("invalid_id_token");
  });

  it("valid ID token → sets HttpOnly lj_session; ignores body spoof email/uid", async () => {
    process.env.LJD_VERIFIED_AUTH_SESSION_ENABLED = "YES";
    process.env.NODE_ENV = "production";
    enableAdminEnv();
    verifyIdToken.mockResolvedValue({
      uid: "uid-verified",
      email: "verified@example.com",
      email_verified: true,
    });
    createSessionCookie.mockResolvedValue("cookie-from-admin");

    const { POST } = await import("@/app/api/auth/session/verified/route");
    const res = await POST(
      new Request("http://localhost/api/auth/session/verified", {
        method: "POST",
        headers: {
          Authorization: "Bearer good-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "spoof@attacker.com",
          uid: "uid-attacker",
        }),
      }),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.uid).toBe("uid-verified");
    expect(json.email).toBe("verified@example.com");
    expect(json.uid).not.toBe("uid-attacker");
    expect(json.email).not.toBe("spoof@attacker.com");

    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("lj_session=");
    expect(setCookie.toLowerCase()).toContain("httponly");
    expect(setCookie.toLowerCase()).toContain("samesite=lax");
    expect(setCookie.toLowerCase()).toContain("secure");
    expect(verifyIdToken).toHaveBeenCalledWith("good-token");
  });

  it("email-less claim → fail-closed", async () => {
    process.env.LJD_VERIFIED_AUTH_SESSION_ENABLED = "YES";
    enableAdminEnv();
    verifyIdToken.mockResolvedValue({ uid: "uid-only" });
    const { POST } = await import("@/app/api/auth/session/verified/route");
    const res = await POST(
      new Request("http://localhost/api/auth/session/verified", {
        method: "POST",
        headers: { Authorization: "Bearer tok" },
      }),
    );
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe("id_token_email_required");
    expect(createSessionCookie).not.toHaveBeenCalled();
  });

  it("DELETE clears lj_session", async () => {
    process.env.LJD_VERIFIED_AUTH_SESSION_ENABLED = "YES";
    const { DELETE } = await import("@/app/api/auth/session/verified/route");
    const res = await DELETE();
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("lj_session=");
    expect(setCookie).toMatch(/max-age=0/i);
    expect(setCookie.toLowerCase()).toContain("httponly");
  });

  it("GET authenticated uses verified session only", async () => {
    process.env.LJD_VERIFIED_AUTH_SESSION_ENABLED = "YES";
    enableAdminEnv();
    cookieStore.get.mockImplementation((name: string) =>
      name === "lj_session" ? { value: "sess" } : undefined,
    );
    verifySessionCookie.mockResolvedValue({
      uid: "uid-g",
      email: "g@example.com",
    });
    const { GET } = await import("@/app/api/auth/session/verified/route");
    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      authenticated: true,
      uid: "uid-g",
      email: "g@example.com",
    });
  });
});

describe("legacy /api/auth/session unchanged", () => {
  it("still accepts body email without Bearer (legacy contract)", async () => {
    const { POST } = await import("@/app/api/auth/session/route");
    const res = await POST(
      new Request("http://localhost/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "Legacy@Example.com" }),
      }),
    );
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("lj_logged_in=1");
    expect(setCookie).toContain("lj_user_email=");
    // Legacy cookies are intentionally not HttpOnly.
    expect(setCookie.toLowerCase()).not.toMatch(/lj_user_email=[^;]*httponly/i);
  });
});
