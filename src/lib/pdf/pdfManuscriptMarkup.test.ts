import { describe, expect, it } from "vitest";

import { parseManuscriptLineMarkup } from "./pdfManuscriptMarkup";

describe("parseManuscriptLineMarkup", () => {
  it("parses line-leading tilde as full-line italic", () => {
    expect(parseManuscriptLineMarkup("~本当はどんなことを大切にしたいのか。")).toEqual([
      { text: "本当はどんなことを大切にしたいのか。", italic: true },
    ]);
  });

  it("parses inline asterisk spans", () => {
    expect(parseManuscriptLineMarkup("*もっとできるようになりたい、*とか。")).toEqual([
      { text: "もっとできるようになりたい、", italic: true },
      { text: "とか。" },
    ]);
  });
});
