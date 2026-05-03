import { NextResponse } from "next/server";

import { getViewerEmailFromCookie } from "@/lib/auth/viewer";
import { prisma } from "@/lib/db";
import { buildOrderPayload } from "@/lib/order/buildSnapshot";
import { toIsoDateString } from "@/lib/order/birthDate";
import { fetchAccountPdfDownloadLimitOrNull } from "@/lib/order/effectivePdfDownloadLimit";
import type { CustomerFormValues } from "@/lib/order/types";
import { profileByIdForViewer, resolveActiveProfileId } from "@/lib/profile/activeProfile";
import { isHiraganaOnly } from "@/lib/validation/hiragana";

import { describeSaveError, tryNormalizeCreateBody } from "./postHelpers";

export async function GET() {
  try {
    const rows = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        createdAt: true,
        lastName: true,
        firstName: true,
        email: true,
        status: true,
      },
    });
    return NextResponse.json(rows);
  } catch (err) {
    const desc = describeSaveError(err);
    console.error("[GET /api/orders]", desc.logLine);
    return NextResponse.json({ error: desc.clientMessage }, { status: desc.httpStatus });
  }
}

export async function POST(req: Request) {
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
    console.warn("[POST /api/orders] バリデーション失敗:", normalized.error);
    return NextResponse.json(
      { error: normalized.error, code: "VALIDATION" },
      { status: normalized.status },
    );
  }

  const j = normalized.body;
  const requestedProfileId =
    typeof json === "object" && json !== null && "profileId" in json
      ? String((json as { profileId: unknown }).profileId).trim()
      : "";
  const activeProfileId = await resolveActiveProfileId(viewerEmail);
  const profileId = requestedProfileId || activeProfileId;
  if (profileId) {
    const profile = await profileByIdForViewer(profileId, viewerEmail);
    if (!profile) {
      return NextResponse.json(
        { error: "指定プロフィールには保存できません。", code: "FORBIDDEN_PROFILE" },
        { status: 403 },
      );
    }
  }
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
    postalCode: "",
    address: "",
    phone: "",
    email: viewerEmail,
    stoneFocusTheme: "特に決まっていない",
  };

  let payload;
  try {
    payload = buildOrderPayload(base);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "数秘・守護石の計算に失敗しました";
    console.error("[POST /api/orders] buildOrderPayload:", msg);
    return NextResponse.json(
      { error: `計算エラー: ${msg}`, code: "BUILD_PAYLOAD" },
      { status: 400 },
    );
  }

  const accountCap = await fetchAccountPdfDownloadLimitOrNull(viewerEmail);
  const pdfDownloadLimitForOrder = accountCap ?? 2;

  try {
    const order = await prisma.order.create({
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
        postalCode: payload.postalCode,
        address: payload.address,
        phone: payload.phone,
        email: payload.email,
        profileId,
        numerologyJson: JSON.stringify(payload.numerology),
        stonesJson: JSON.stringify(payload.stones),
        stoneFocusTheme: payload.stoneFocusTheme,
        pdfDownloadLimit: pdfDownloadLimitForOrder,
        status: "completed",
      },
    });
    return NextResponse.json({ id: order.id, code: "OK" });
  } catch (err) {
    const desc = describeSaveError(err);
    console.error("[POST /api/orders] DB保存失敗:", desc.logLine);
    return NextResponse.json(
      {
        error: desc.clientMessage,
        code: "DB_SAVE",
        hint:
          process.env.NODE_ENV === "development"
            ? "ターミナルに [POST /api/orders] と Prisma のログを確認してください"
            : undefined,
      },
      { status: desc.httpStatus },
    );
  }
}
