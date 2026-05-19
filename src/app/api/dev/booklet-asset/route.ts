import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

const ASSETS_DIR = path.join(process.cwd(), "src/components/pdf/assets");
const PREVIEW_DIR = path.join(process.cwd(), "src/components/pdf/assets-preview");

function safeBasename(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  const base = path.basename(raw.trim());
  if (base !== raw.trim() || base.includes("..")) return null;
  if (!/\.(png|jpe?g|pdf)$/i.test(base)) return null;
  return base;
}

export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available outside development." }, { status: 404 });
  }

  const url = new URL(req.url);
  const file = safeBasename(url.searchParams.get("file"));
  const folder = url.searchParams.get("folder") === "preview" ? "preview" : "assets";

  if (!file) {
    return NextResponse.json({ error: "Invalid file parameter." }, { status: 400 });
  }

  const dir = folder === "preview" ? PREVIEW_DIR : ASSETS_DIR;
  let filePath = path.join(dir, file);

  try {
    let bytes: Buffer;
    try {
      bytes = await readFile(filePath);
    } catch {
      if (folder === "preview" && /\.png$/i.test(file)) {
        const jpgPath = path.join(dir, file.replace(/\.png$/i, ".jpg"));
        bytes = await readFile(jpgPath);
        filePath = jpgPath;
      } else {
        throw new Error("not found");
      }
    }
    const served = path.basename(filePath).toLowerCase();
    const type = served.endsWith(".pdf")
      ? "application/pdf"
      : served.endsWith(".png")
        ? "image/png"
        : "image/jpeg";
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
}
