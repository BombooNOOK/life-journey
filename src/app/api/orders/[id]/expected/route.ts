import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import type { ExpectedCoreFivePartial } from "@/lib/verification/coreFive";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function isExpectedBody(x: unknown): x is { expected: ExpectedCoreFivePartial | null } {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return "expected" in o && (o.expected === null || typeof o.expected === "object");
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "注文が見つかりません" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON が不正です" }, { status: 400 });
  }
  if (!isExpectedBody(json)) {
    return NextResponse.json({ error: "expected オブジェクトが必要です" }, { status: 400 });
  }

  const expectedJson =
    json.expected === null || Object.keys(json.expected).length === 0
      ? null
      : JSON.stringify(json.expected);

  await prisma.order.update({
    where: { id },
    data: { expectedNumerologyJson: expectedJson },
  });

  return NextResponse.json({ ok: true });
}
