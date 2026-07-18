import { describe, expect, it } from "vitest";

import { companionTypes } from "@/lib/journal/meta";

import {
  COMPANION_WRITING_OMAKASE_ID,
  ensureOmakaseCompanionResolved,
  pickOmakaseCompanion,
  resolveCompanionWritingChoice,
} from "./omakase";

describe("companionWriting omakase", () => {
  it("おまかせは5人の鑑定士から選ばれる", () => {
    const picked = pickOmakaseCompanion();
    expect(companionTypes).toContain(picked);
  });

  it("おまかせはセッション中固定の鑑定士に解決される", () => {
    expect(resolveCompanionWritingChoice("owl", null)).toBe("owl");
    expect(resolveCompanionWritingChoice(COMPANION_WRITING_OMAKASE_ID, "frog")).toBe("frog");
  });

  it("おまかせ未確定なら ensure で1人を確定する", () => {
    const resolved = ensureOmakaseCompanionResolved(COMPANION_WRITING_OMAKASE_ID, null);
    expect(companionTypes).toContain(resolved);
    expect(ensureOmakaseCompanionResolved(COMPANION_WRITING_OMAKASE_ID, "sloth")).toBe("sloth");
    expect(ensureOmakaseCompanionResolved("hedgehog", null)).toBe("hedgehog");
  });
});
