import { writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import {
  buildDailyFortuneLayoutTsSource,
  isDailyFortunePercentRect,
} from "@/lib/ljd/dailyFortuneLayoutFile";
import {
  DAILY_FORTUNE_LAYOUT_SLOT_IDS,
  type DailyFortuneLayoutSlotId,
  type DailyFortunePercentRect,
} from "@/lib/ljd/dailyFortuneLayout";

const LAYOUT_PATH = path.join(process.cwd(), "src/lib/ljd/dailyFortuneLayout.ts");

function parseLayout(raw: unknown): Record<DailyFortuneLayoutSlotId, DailyFortunePercentRect> | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const out = {} as Record<DailyFortuneLayoutSlotId, DailyFortunePercentRect>;
  for (const id of DAILY_FORTUNE_LAYOUT_SLOT_IDS) {
    if (!isDailyFortunePercentRect(obj[id])) return null;
    out[id] = obj[id] as DailyFortunePercentRect;
  }
  return out;
}

/** 開発時のみ：定規の下書きを dailyFortuneLayout.ts に書き込む */
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
  const layout = parseLayout(record?.layout);
  if (!layout) {
    return NextResponse.json({ error: "layout incomplete" }, { status: 400 });
  }

  const source = buildDailyFortuneLayoutTsSource(layout);
  await writeFile(LAYOUT_PATH, source, "utf8");

  return NextResponse.json({ ok: true, path: "src/lib/ljd/dailyFortuneLayout.ts" });
}
