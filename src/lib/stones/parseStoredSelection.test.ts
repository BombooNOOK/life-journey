import { describe, expect, it } from "vitest";

import { parseStoredStoneSelection } from "./parseStoredSelection";

describe("parseStoredStoneSelection", () => {
  it("有効な JSON を返す", () => {
    const raw = JSON.stringify({
      mainStone: { id: "a", nameJa: "石A", tags: [] },
      mainAlternates: [],
      charmStone: { id: "b", nameJa: "石B", tags: ["x"] },
      charmAlternates: [],
      rationale: ["r1"],
    });
    const s = parseStoredStoneSelection(raw);
    expect(s?.mainStone.id).toBe("a");
    expect(s?.charmStone.nameJa).toBe("石B");
    expect(s?.rationale).toEqual(["r1"]);
  });

  it("壊れた JSON は null", () => {
    expect(parseStoredStoneSelection("")).toBeNull();
    expect(parseStoredStoneSelection("{")).toBeNull();
    expect(parseStoredStoneSelection(null)).toBeNull();
  });
});
