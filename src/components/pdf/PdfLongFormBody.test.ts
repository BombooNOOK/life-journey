import { describe, expect, it } from "vitest";

import {
  splitBodyIntoMajorBlocksAndSentenceLines,
  splitBodyIntoManuscriptLineNodes,
  splitBodyIntoParagraphs,
} from "./PdfLongFormBody";

describe("splitBodyIntoParagraphs", () => {
  it("空行で段落に分け、単独改行は空白にまとめる", () => {
    expect(splitBodyIntoParagraphs("")).toEqual([]);
    expect(splitBodyIntoParagraphs("一つの段落")).toEqual(["一つの段落"]);
    expect(splitBodyIntoParagraphs("前\n後")).toEqual(["前 後"]);
    expect(splitBodyIntoParagraphs("A\n\nB")).toEqual(["A", "B"]);
  });
});

describe("splitBodyIntoManuscriptLineNodes", () => {
  it("改行ごとにノード化し、空要素は空行", () => {
    expect(splitBodyIntoManuscriptLineNodes("一行")).toEqual([{ kind: "text", content: "一行" }]);
    expect(splitBodyIntoManuscriptLineNodes("前\n後")).toEqual([
      { kind: "text", content: "前" },
      { kind: "text", content: "後" },
    ]);
    expect(splitBodyIntoManuscriptLineNodes("A\n\nB")).toEqual([
      { kind: "text", content: "A" },
      { kind: "blank" },
      { kind: "text", content: "B" },
    ]);
  });
});

describe("splitBodyIntoMajorBlocksAndSentenceLines", () => {
  it("空行で大ブロックに分け、各ブロック内は句点のあとで行に分ける", () => {
    expect(splitBodyIntoMajorBlocksAndSentenceLines("")).toEqual([]);
    expect(splitBodyIntoMajorBlocksAndSentenceLines("一文。")).toEqual([["一文。"]]);
    expect(splitBodyIntoMajorBlocksAndSentenceLines("一文。二文。")).toEqual([["一文。", "二文。"]]);
    expect(splitBodyIntoMajorBlocksAndSentenceLines("A。\n\nB。")).toEqual([["A。"], ["B。"]]);
  });
});
