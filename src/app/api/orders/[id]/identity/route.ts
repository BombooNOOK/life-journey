import { NextResponse } from "next/server";

import { getViewerEmailFromCookie, normalizeEmail } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { buildOrderPayload } from "@/lib/order/buildSnapshot";
import { toIsoDateString } from "@/lib/order/birthDate";
import type { CustomerFormValues } from "@/lib/order/types";
import { isHiraganaOnly } from "@/lib/validation/hiragana";

import { describeSaveError, tryNormalizeCreateBody } from "../../postHelpers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 氏名・生年月日の1回限り救済修正。数秘・石を再計算して上書きする。
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const viewerEmail = await getViewerEmailFromCookie();
  if (!viewerEmail) {
    return NextResponse.json(
      {
        error: "ログイン情報を確認できませんでした。いったんログアウトして再ログインしてください。",
        code: "AUTH_REQUIRED",
      },
      { status: 401 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { error: "JSON が不正です（リクエスト本文を読めません）", code: "BAD_JSON" },
      { status: 400 },
    );
  }

  const normalized = tryNormalizeCreateBody(json);
  if (!normalized.ok) {
    return NextResponse.json(
      { error: normalized.error, code: "VALIDATION" },
      { status: normalized.status },
    );
  }

  const j = normalized.body;
  const yNow = new Date().getFullYear();
  if (j.birthYear < 1870 || j.birthYear > yNow) {
    return NextResponse.json({ error: "生年が許容範囲外です", code: "YEAR_RANGE" }, { status: 400 });
  }

  const lastName = j.lastName.trim();
  const firstName = j.firstName.trim();
  const lastNameKana = j.lastNameKana.trim();
  const firstNameKana = j.firstNameKana.trim();

  if (!lastName || !firstName) {
    return NextResponse.json({ error: "姓・名は必須です", code: "NAME" }, { status: 400 });
  }
  if (!lastNameKana || !firstNameKana) {
    return NextResponse.json(
      { error: "ふりがな（せい・めい）は必須です", code: "KANA" },
      { status: 400 },
    );
  }
  if (!isHiraganaOnly(lastNameKana) || !isHiraganaOnly(firstNameKana)) {
    return NextResponse.json(
      { error: "ふりがなはひらがなのみで入力してください", code: "KANA_SCRIPT" },
      { status: 400 },
    );
  }

  let birthDate: string;
  try {
    birthDate = toIsoDateString(j.birthYear, j.birthMonth, j.birthDay);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "生年月日が不正です";
    return NextResponse.json({ error: msg, code: "BAD_DATE" }, { status: 400 });
  }

  let row;
  try {
    row = await prisma.order.findUnique({ where: { id } });
  } catch (err) {
    const desc = describeSaveError(err);
    console.error("[PATCH identity] find:", desc.logLine);
    return NextResponse.json({ error: desc.clientMessage }, { status: desc.httpStatus });
  }

  if (!row) {
    return NextResponse.json({ error: "注文が見つかりません", code: "NOT_FOUND" }, { status: 404 });
  }
  if (normalizeEmail(row.email) !== viewerEmail) {
    return NextResponse.json({ error: "この注文にはアクセスできません", code: "FORBIDDEN" }, { status: 403 });
  }
  if ((row.identityCorrectionCount ?? 0) >= 1) {
    return NextResponse.json(
      { error: "氏名・生年月日の修正はすでに利用済みです。", code: "CORRECTION_USED" },
      { status: 409 },
    );
  }

  const base: CustomerFormValues = {
    lastName,
    firstName,
    lastNameKana,
    firstNameKana,
    lastNameRoman: "",
    firstNameRoman: "",
    fullNameDisplay: "",
    fullNameKanaDisplay: "",
    fullNameRomanDisplay: "",
    birthDate,
    birthYear: j.birthYear,
    birthMonth: j.birthMonth,
    birthDay: j.birthDay,
    postalCode: row.postalCode,
    address: row.address,
    phone: row.phone,
    email: row.email,
    stoneFocusTheme: row.stoneFocusTheme?.trim() || "特に決まっていない",
  };

  let payload;
  try {
    payload = buildOrderPayload(base);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "数秘・守護石の計算に失敗しました";
    console.error("[PATCH identity] buildOrderPayload:", msg);
    return NextResponse.json(
      { error: `計算エラー: ${msg}`, code: "BUILD_PAYLOAD" },
      { status: 400 },
    );
  }

  try {
    await prisma.order.update({
      where: { id: row.id },
      data: {
        lastName: payload.lastName,
        firstName: payload.firstName,
        lastNameKana: payload.lastNameKana,
        firstNameKana: payload.firstNameKana,
        lastNameRoman: payload.lastNameRoman,
        firstNameRoman: payload.firstNameRoman,
        fullNameDisplay: payload.fullNameDisplay,
        fullNameKanaDisplay: payload.fullNameKanaDisplay,
        fullNameRomanDisplay: payload.fullNameRomanDisplay,
        birthDate: payload.birthDate,
        birthYear: payload.birthYear,
        birthMonth: payload.birthMonth,
        birthDay: payload.birthDay,
        numerologyJson: JSON.stringify(payload.numerology),
        stonesJson: JSON.stringify(payload.stones),
        identityCorrectionCount: 1,
        reportPdfPath: null,
      },
    });
    return NextResponse.json({ ok: true, code: "OK" });
  } catch (err) {
    const desc = describeSaveError(err);
    console.error("[PATCH identity] update:", desc.logLine);
    return NextResponse.json({ error: desc.clientMessage, code: "DB_SAVE" }, { status: desc.httpStatus });
  }
}
