import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { sha256HexSync } from "@/lib/crypto/sha256HexSync";
import { sha256Hex } from "@/lib/journal/saveIdempotency/productionRequestFingerprint";

describe("sha256HexSync isomorphic parity", () => {
  it("matches Node createHash for representative strings", () => {
    const samples = ["", "a", "hello", "写真付きあしあと", "x".repeat(4096)];
    for (const sample of samples) {
      const node = createHash("sha256").update(sample, "utf8").digest("hex");
      expect(sha256HexSync(sample)).toBe(node);
      expect(sha256Hex(sample)).toBe(node);
    }
  });
});
