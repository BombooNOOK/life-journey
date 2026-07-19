import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

import {
  markForestBookshelfSpotGuideSeen,
  resolveForestBookshelfSpotGuide,
} from "@/lib/ljd/forestBookshelfFirstVisitGuide";

describe("forestBookshelfFirstVisitGuide", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("prefers kantei guide before ashiato", () => {
    expect(
      resolveForestBookshelfSpotGuide({
        hasKantei: true,
        hasAshiatoBook: true,
      }),
    ).toBe("kantei");
  });

  it("shows ashiato after kantei is marked seen", () => {
    markForestBookshelfSpotGuideSeen("kantei");
    expect(
      resolveForestBookshelfSpotGuide({
        hasKantei: true,
        hasAshiatoBook: true,
      }),
    ).toBe("ashiato");
  });

  it("returns null when both guides are seen", () => {
    markForestBookshelfSpotGuideSeen("kantei");
    markForestBookshelfSpotGuideSeen("ashiato");
    expect(
      resolveForestBookshelfSpotGuide({
        hasKantei: true,
        hasAshiatoBook: true,
      }),
    ).toBeNull();
  });
});
