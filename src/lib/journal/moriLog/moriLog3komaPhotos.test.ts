import { describe, expect, it } from "vitest";

import {
  assignMori3komaPanel,
  DEFAULT_MORI_3KOMA_PANEL_ASSIGNMENT,
  mori3komaAssignmentIncludesMain,
  parseMori3komaPanelAssignment,
  serializeMori3komaPanelAssignment,
} from "./moriLog3komaPhotos";

describe("moriLog3komaPhotos", () => {
  it("parses and serializes panel assignment", () => {
    const raw = "extra0,main,extra1";
    const parsed = parseMori3komaPanelAssignment(raw);
    expect(parsed).toEqual(["extra0", "main", "extra1"]);
    expect(serializeMori3komaPanelAssignment(parsed!)).toBe(raw);
  });

  it("rejects assignment without main", () => {
    expect(parseMori3komaPanelAssignment("extra0,extra1,extra0")).toBeNull();
    expect(mori3komaAssignmentIncludesMain(["extra0", "extra1", "extra0"])).toBe(false);
  });

  it("keeps main when reassignment would remove it", () => {
    const onlyMainFirst: typeof DEFAULT_MORI_3KOMA_PANEL_ASSIGNMENT = [
      "main",
      "extra0",
      "extra1",
    ];
    expect(assignMori3komaPanel(onlyMainFirst, 0, "extra0")).toEqual(onlyMainFirst);
    expect(assignMori3komaPanel(onlyMainFirst, 1, "main")).toEqual(["main", "main", "extra1"]);
  });
});
