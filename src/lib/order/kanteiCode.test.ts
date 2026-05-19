import { describe, expect, it } from "vitest";

import {
  buildKanteiCode,
  buildKanteiPdfDownloadFilename,
  formatKanteiCodeDatePart,
  randomKanteiCodeSuffix,
} from "./kanteiCode";

describe("kanteiCode", () => {
  it("formats date in Asia/Tokyo", () => {
    const utcLate = new Date("2026-05-18T15:00:00.000Z");
    expect(formatKanteiCodeDatePart(utcLate)).toBe("20260519");
  });

  it("builds code with LJK prefix and 4-char suffix", () => {
    const code = buildKanteiCode(new Date("2026-05-19T03:00:00.000Z"));
    expect(code).toMatch(/^LJK-20260519-[A-Z0-9]{4}$/);
  });

  it("random suffix uses allowed alphabet", () => {
    const suffix = randomKanteiCodeSuffix(4);
    expect(suffix).toMatch(/^[A-Z0-9]{4}$/);
  });

  it("builds download filename", () => {
    expect(buildKanteiPdfDownloadFilename("LJK-20260519-A8K3", "preview")).toBe(
      "LifeJourney_Kantei_LJK-20260519-A8K3_preview.pdf",
    );
    expect(buildKanteiPdfDownloadFilename("LJK-20260519-A8K3", "print")).toBe(
      "LifeJourney_Kantei_LJK-20260519-A8K3_print.pdf",
    );
  });
});
