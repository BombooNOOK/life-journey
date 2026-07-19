import type { ForestBookshelfSpotId } from "@/lib/ljd/forestBookshelfLayout";

/** localStorage: 鑑定書の「ここだよ」を見たら "1" */
export const FOREST_BOOKSHELF_KANTEI_SPOT_SEEN_KEY =
  "ljd.forestBookshelf.kanteiSpotGuideSeen.v1" as const;

/** localStorage: あしあとブックの「ここだよ」を見たら "1" */
export const FOREST_BOOKSHELF_ASHIATO_SPOT_SEEN_KEY =
  "ljd.forestBookshelf.ashiatoSpotGuideSeen.v1" as const;

export type ForestBookshelfSpotGuideKind = "kantei" | "ashiato";

export const FOREST_BOOKSHELF_KANTEI_SPOT_OWL_QUOTE =
  "いちばん上の棚に、鑑定書が届いています。\n\n光っている本をタップして、開いてみてください。" as const;

export const FOREST_BOOKSHELF_ASHIATO_SPOT_OWL_QUOTE =
  "あしあとブックが、本棚に並びました。\n\n光っている本をタップすると、中身を見られます。" as const;

function storageGet(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // ignore
  }
}

export function readForestBookshelfSpotGuideSeen(kind: ForestBookshelfSpotGuideKind): boolean {
  const key =
    kind === "kantei" ? FOREST_BOOKSHELF_KANTEI_SPOT_SEEN_KEY : FOREST_BOOKSHELF_ASHIATO_SPOT_SEEN_KEY;
  return storageGet(key) === "1";
}

export function markForestBookshelfSpotGuideSeen(kind: ForestBookshelfSpotGuideKind): void {
  const key =
    kind === "kantei" ? FOREST_BOOKSHELF_KANTEI_SPOT_SEEN_KEY : FOREST_BOOKSHELF_ASHIATO_SPOT_SEEN_KEY;
  storageSet(key, "1");
}

export function spotIdForBookshelfGuide(kind: ForestBookshelfSpotGuideKind): ForestBookshelfSpotId {
  return kind === "kantei" ? "kanteiCover" : "currentDiary";
}

export function owlQuoteForBookshelfGuide(kind: ForestBookshelfSpotGuideKind): string {
  return kind === "kantei"
    ? FOREST_BOOKSHELF_KANTEI_SPOT_OWL_QUOTE
    : FOREST_BOOKSHELF_ASHIATO_SPOT_OWL_QUOTE;
}

/**
 * 鑑定書優先。あしあとブックは「1冊以上ある・鑑定書ガイドが済」のとき。
 */
export function resolveForestBookshelfSpotGuide(input: {
  hasKantei: boolean;
  hasAshiatoBook: boolean;
}): ForestBookshelfSpotGuideKind | null {
  if (input.hasKantei && !readForestBookshelfSpotGuideSeen("kantei")) {
    return "kantei";
  }
  if (input.hasAshiatoBook && !readForestBookshelfSpotGuideSeen("ashiato")) {
    return "ashiato";
  }
  return null;
}
