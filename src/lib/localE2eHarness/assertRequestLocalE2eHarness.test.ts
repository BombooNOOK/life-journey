import { afterEach, describe, expect, it, vi } from "vitest";

import { assertLocalE2eHarnessRequest } from "@/lib/localE2eHarness/assertRequestLocalE2eHarness";

const ACTOR = "local-e2e-actor@ljd.local";
const LOCAL_DB = "postgresql://ljd:ljd_local_dev@127.0.0.1:5433/ljd_dev?schema=public";

describe("local-e2e request assert", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 404 when gates fail (Preview-like host)", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("LJD_ENABLE_LOCAL_E2E_HARNESS", "YES");
    vi.stubEnv("LJD_LOCAL_E2E_ACTOR_EMAIL", ACTOR);
    vi.stubEnv("DATABASE_URL", LOCAL_DB);

    const denied = assertLocalE2eHarnessRequest(
      new Request("https://preview.example/api/local-e2e/session", {
        headers: { host: "life-journey-git-preview.vercel.app" },
      }),
    );
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.response.status).toBe(404);
  });

  it("accepts loopback when gates pass and never trusts body email", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("LJD_ENABLE_LOCAL_E2E_HARNESS", "YES");
    vi.stubEnv("LJD_LOCAL_E2E_ACTOR_EMAIL", ACTOR);
    vi.stubEnv("DATABASE_URL", LOCAL_DB);

    const ok = assertLocalE2eHarnessRequest(
      new Request("http://127.0.0.1:3000/api/local-e2e/session", {
        method: "POST",
        headers: { host: "127.0.0.1:3000", "content-type": "application/json" },
        body: JSON.stringify({ email: "attacker@evil.example" }),
      }),
    );
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.actorEmail).toBe(ACTOR);
  });
});
