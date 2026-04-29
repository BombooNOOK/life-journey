import { Document, renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

import { BirthdayPage } from "@/components/pdf/pages/BirthdayPage";
import { ensureJapaneseFont } from "@/components/pdf/registerFonts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseBirthday(v: string | null): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 1;
  const allowed = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22]);
  return allowed.has(n) ? n : 1;
}

export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available outside development." }, { status: 404 });
  }

  const url = new URL(req.url);
  const birthday = parseBirthday(url.searchParams.get("birthday"));

  ensureJapaneseFont();
  const buffer = await renderToBuffer(
    <Document>
      <BirthdayPage birthday={birthday} />
    </Document>,
  );

  return new NextResponse(Buffer.from(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="birthday-${birthday}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
