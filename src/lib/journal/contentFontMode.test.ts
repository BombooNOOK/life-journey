import { describe, expect, it } from "vitest";

import { layoutEquivalentContentLength } from "./contentFontMode";

describe("layoutEquivalentContentLength", () => {
  it("recalculates from current text only", () => {
    const a = layoutEquivalentContentLength("hello\n\nworld", "standard");
    const b = layoutEquivalentContentLength("hello\nworld", "standard");
    expect(a).toBeGreaterThan(b);
    expect(layoutEquivalentContentLength("hello\nworld", "standard")).toBe(b);
  });

  it("adds modest cost per newline", () => {
    expect(layoutEquivalentContentLength("ab\ncd", "standard")).toBe(2 + 10 + 2);
  });

  it("does not grow when newlines are removed", () => {
    const withBreak = layoutEquivalentContentLength("aaa\nbbb", "standard");
    const plain = layoutEquivalentContentLength("aaabbb", "standard");
    expect(withBreak).toBeGreaterThan(plain);
    expect(plain).toBe(6);
  });
});
