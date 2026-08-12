import { describe, expect, it } from "vitest";

import { sha256HexOfBase64, sha256HexOfUtf8 } from "@/lib/local-first/journal/checksum";

describe("sha256HexOfBase64 (migration integrity)", () => {
  it("is stable for known input", async () => {
    const b64 = btoa("ljd-local-first-checksum");
    const a = await sha256HexOfBase64(b64);
    const b = await sha256HexOfBase64(b64);
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it("changes when bytes change", async () => {
    const a = await sha256HexOfBase64(btoa("one"));
    const b = await sha256HexOfBase64(btoa("two"));
    expect(a).not.toBe(b);
  });
});

describe("sha256HexOfUtf8 (source fingerprint)", () => {
  it("hashes content without exposing the body", async () => {
    const hash = await sha256HexOfUtf8("テスト本文 #LocalCopyTest");
    expect(hash).toHaveLength(64);
    expect(hash).not.toContain("テスト本文");
  });
});
