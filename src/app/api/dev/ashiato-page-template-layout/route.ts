import { writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import {
  buildAshiatoPageTemplateLayoutDataTsSource,
  parseAshiatoPageTemplateLayouts,
} from "@/lib/journal/ashiatoPageTemplateLayoutFile";

const LAYOUT_PATH = path.join(
  process.cwd(),
  "src/lib/journal/ashiatoPageTemplateLayoutData.ts",
);

/** 開発時のみ：定規の下書きを ashiatoPageTemplateLayoutData.ts に書き込む */
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
  const layouts = parseAshiatoPageTemplateLayouts(record?.layouts);
  if (!layouts) {
    return NextResponse.json({ error: "layouts incomplete" }, { status: 400 });
  }

  const source = buildAshiatoPageTemplateLayoutDataTsSource(layouts);
  await writeFile(LAYOUT_PATH, source, "utf8");

  return NextResponse.json({
    ok: true,
    path: "src/lib/journal/ashiatoPageTemplateLayoutData.ts",
  });
}
