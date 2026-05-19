import { NextResponse } from "next/server";

import { formatKanteiCodeErrorDetail, getKanteiCodeDiagnostics } from "@/lib/order/kanteiCode";

/** ブラウザ・プロキシの切り分け用（JSON が返れば HTTP は正常） */
export async function GET() {
  try {
    const kantei = await getKanteiCodeDiagnostics();
    return NextResponse.json({
      ok: true,
      service: "numerology-mvp",
      kantei,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        service: "numerology-mvp",
        kanteiError: formatKanteiCodeErrorDetail(err),
      },
      { status: 500 },
    );
  }
}
