import { describe, expect, it } from "vitest";

/**
 * Pure checksum helper used by migration media integrity checks.
 * Runs without Capacitor native plugins.
 */
async function sha256HexOfBase64(base64Data: string): Promise<string> {
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

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
