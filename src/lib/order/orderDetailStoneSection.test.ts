import { describe, expect, it } from "vitest";

import { buildStoneComparisonProps } from "./orderDetailStoneSection";

const minimalNumerologyJson = JSON.stringify({
  lifePathNumber: 2,
  destinyNumber: 11,
  soulNumber: 6,
  personalityNumber: 5,
  birthdayNumber: 6,
  bridges: {
    lifePathDestiny: 9,
    soulPersonality: 1,
    birthdayLifePath: 4,
  },
});

const baseSlice = {
  numerologyJson: minimalNumerologyJson,
  birthDate: "1988-06-06",
  birthYear: 1988,
  birthMonth: 6,
  birthDay: 6,
  stonesJson: "",
};

describe("buildStoneComparisonProps", () => {
  it("有効な注文スライスでは ok: true を返す", () => {
    const r = buildStoneComparisonProps(baseSlice);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.props.numerologyCurrent).not.toBeNull();
      expect(r.props.stonesStored).toBeNull();
    }
  });

  it("壊れた numerologyJson でも例外にせず ok: true（表示は null に落ちる）", () => {
    const r = buildStoneComparisonProps({
      ...baseSlice,
      numerologyJson: "{",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.props.numerologyAtSave).toBeNull();
      expect(r.props.numerologyCurrent).toBeNull();
    }
  });

  it("壊れた stonesJson でも ok: true（stonesStored は null）", () => {
    const r = buildStoneComparisonProps({
      ...baseSlice,
      stonesJson: "{",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.props.stonesStored).toBeNull();
    }
  });

  it("保存済み石の JSON があれば stonesStored を返す", () => {
    const stonesJson = JSON.stringify({
      mainStone: { id: "a", nameJa: "石A", tags: [] },
      mainAlternates: [],
      charmStone: { id: "b", nameJa: "石B", tags: [] },
      charmAlternates: [],
      rationale: [],
    });
    const r = buildStoneComparisonProps({ ...baseSlice, stonesJson });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.props.stonesStored?.mainStone.id).toBe("a");
    }
  });
});
