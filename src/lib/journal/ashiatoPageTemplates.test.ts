import { describe, expect, it } from "vitest";

import {
  ashiatoCoverImagePath,
  normalizeDiaryCoverStyle,
} from "@/lib/journal/coverAssets";
import {
  ashiatoPageTemplatePreviewPath,
  normalizeAshiatoPageTemplateId,
} from "@/lib/journal/ashiatoPageTemplates";
import { parseDiaryBookCreateFields } from "@/lib/journal/diaryBookForm";

describe("ashiato cover / page template", () => {
  it("maps legacy cover IDs to the new ashiato covers", () => {
    expect(normalizeDiaryCoverStyle("casual")).toBe("cover_mori_standard");
    expect(normalizeDiaryCoverStyle("kireime")).toBe("cover_mori_irodori");
    expect(normalizeDiaryCoverStyle("cover_komorebi")).toBe("cover_komorebi");
  });

  it("defaults unknown page templates to irodori", () => {
    expect(normalizeAshiatoPageTemplateId("")).toBe("suuji_ashiato_irodori");
    expect(normalizeAshiatoPageTemplateId("mori_enikki")).toBe("mori_enikki");
  });

  it("builds ashiato asset paths under /images/ashiato/", () => {
    expect(ashiatoCoverImagePath("cover_komorebi")).toContain(
      "/images/ashiato/ashiato_cover_komorebi.png",
    );
    expect(ashiatoPageTemplatePreviewPath("mori_yohaku_note")).toContain(
      "ashiato_template_mori_yohaku_note_preview.png",
    );
  });

  it("parses create fields with pageTemplate", () => {
    const parsed = parseDiaryBookCreateFields({
      title: "テスト",
      startDate: "2026-01-01",
      endDate: "2026-01-31",
      coverTheme: "cover_komorebi",
      pageTemplate: "mori_enikki",
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data.coverTheme).toBe("cover_komorebi");
    expect(parsed.data.pageTemplate).toBe("mori_enikki");
  });
});
