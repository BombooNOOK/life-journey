import { writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import {
  buildForestBookshelfLayoutTsSource,
  isForestBookshelfRect,
} from "@/lib/ljd/forestBookshelfLayoutFile";
import type {
  ForestBookshelfItemId,
  ForestBookshelfRect,
  ForestBookshelfSpotId,
} from "@/lib/ljd/forestBookshelfLayout";

const LAYOUT_PATH = path.join(process.cwd(), "src/lib/ljd/forestBookshelfLayout.ts");

const ITEM_IDS: ForestBookshelfItemId[] = [
  "plant",
  "lanternShelf",
  "kanteiCover",
  "spinesFortune",
  "createDiary",
  "currentDiary",
  "placeholderRed",
  "placeholderGreen",
  "spinesDiary",
  "owl",
  "lanternFloor",
];

const SPOT_IDS: ForestBookshelfSpotId[] = [
  "kanteiCover",
  "spinesFortune",
  "createDiary",
  "currentDiary",
  "placeholderRed",
  "placeholderGreen",
  "spinesDiary",
];

function parseRectMap<T extends string>(
  raw: unknown,
  ids: T[],
): Record<T, ForestBookshelfRect> | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const out = {} as Record<T, ForestBookshelfRect>;
  for (const id of ids) {
    if (!isForestBookshelfRect(obj[id])) return null;
    out[id] = obj[id] as ForestBookshelfRect;
  }
  return out;
}

/** 開発時のみ：定規の下書きを forestBookshelfLayout.ts に書き込む */
export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "development only" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  const items = parseRectMap(record?.items, ITEM_IDS);
  const spots = parseRectMap(record?.spots, SPOT_IDS);
  if (!items || !spots) {
    return NextResponse.json({ error: "items/spots incomplete" }, { status: 400 });
  }

  const source = buildForestBookshelfLayoutTsSource({ items, spots });
  await writeFile(LAYOUT_PATH, source, "utf8");

  return NextResponse.json({ ok: true, path: "src/lib/ljd/forestBookshelfLayout.ts" });
}
