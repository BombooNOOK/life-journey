import { describe, expect, it } from "vitest";

import { resolveLoginFlow } from "./loginFlow";

describe("resolveLoginFlow", () => {
  it("uses register for first-visit loghouse build and resident card", () => {
    expect(resolveLoginFlow("/guide/first/loghouse")).toBe("register");
    expect(resolveLoginFlow("/guide/first/loghouse?step=2")).toBe("register");
    expect(resolveLoginFlow("/guide/first/resident-card")).toBe("register");
    expect(resolveLoginFlow("/guide/first/resident-card?x=1")).toBe("register");
  });

  it("uses login for loghouse-sign", () => {
    expect(resolveLoginFlow("/guide/first/loghouse-sign")).toBe("login");
  });
});
