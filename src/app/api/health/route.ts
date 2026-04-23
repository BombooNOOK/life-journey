import { NextResponse } from "next/server";

/** ブラウザ・プロキシの切り分け用（JSON が返れば HTTP は正常） */
export function GET() {
  return NextResponse.json({ ok: true, service: "numerology-mvp" });
}
