import { Prisma } from "@prisma/client";

/** クライアントの JSON で数値が文字列になる場合に備えて整数化する */
export function coerceInt(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) {
    const t = Math.trunc(v);
    return t === v ? t : null;
  }
  if (typeof v === "string" && v.trim() !== "") {
    const n = parseInt(v.trim(), 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export interface NormalizedCreateBody {
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
}

/**
 * 必須フィールドの存在チェック + 生年月日の数値化。
 * 失敗時はクライアント向けメッセージ（日本語）を返す。
 */
export function tryNormalizeCreateBody(
  x: unknown,
): { ok: true; body: NormalizedCreateBody } | { ok: false; error: string; status: number } {
  if (!x || typeof x !== "object" || Array.isArray(x)) {
    return { ok: false, error: "リクエストの形式が正しくありません（JSON オブジェクトではありません）", status: 400 };
  }
  const o = x as Record<string, unknown>;

  const str = (k: string) => (typeof o[k] === "string" ? (o[k] as string) : null);
  const lastName = str("lastName");
  const firstName = str("firstName");
  const lastNameKana = str("lastNameKana");
  const firstNameKana = str("firstNameKana");

  if (!lastName || !firstName || !lastNameKana || !firstNameKana) {
    return { ok: false, error: "必須項目が不足しています（氏名・ふりがな）", status: 400 };
  }

  const birthYear = coerceInt(o.birthYear);
  const birthMonth = coerceInt(o.birthMonth);
  const birthDay = coerceInt(o.birthDay);
  if (birthYear === null || birthMonth === null || birthDay === null) {
    return {
      ok: false,
      error: "生年月日は数値で指定してください（ブラウザの自動補完で文字列になっている可能性があります）",
      status: 400,
    };
  }

  return {
    ok: true,
    body: {
      lastName,
      firstName,
      lastNameKana,
      firstNameKana,
      birthYear,
      birthMonth,
      birthDay,
    },
  };
}

/** ターミナル・クライアント向けに Prisma / 不明エラーを短く分類 */
export function describeSaveError(err: unknown): {
  httpStatus: number;
  clientMessage: string;
  logLine: string;
} {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const meta = err.meta ? JSON.stringify(err.meta) : "";
    const logLine = `[Prisma ${err.code}] ${err.message} ${meta}`;
    switch (err.code) {
      case "P2002":
        return {
          httpStatus: 409,
          clientMessage: "同じ内容のデータが既に登録されているため保存できませんでした（重複）",
          logLine,
        };
      case "P2025":
        return {
          httpStatus: 404,
          clientMessage: "更新対象のレコードが見つかりませんでした",
          logLine,
        };
      default:
        return {
          httpStatus: 500,
          clientMessage: `データベースの制約により保存できませんでした（コード: ${err.code}）`,
          logLine,
        };
    }
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    const logLine = `[Prisma Init] ${err.message}`;
    return {
      httpStatus: 503,
      clientMessage:
        "データベースに接続できませんでした。DATABASE_URL と prisma/dev.db の場所、権限を確認してください。",
      logLine,
    };
  }

  if (err instanceof Prisma.PrismaClientRustPanicError) {
    const logLine = `[Prisma Panic] ${err.message}`;
    return {
      httpStatus: 500,
      clientMessage: "データベース処理で内部エラーが発生しました（Prisma）",
      logLine,
    };
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    const logLine = `[Prisma Validation] ${err.message}`;
    const devHint =
      " 対処: プロジェクト直下で `npx prisma db push` と `npx prisma generate` を実行し、`next dev` を再起動してください（`stoneFocusTheme` 列追加後に未実行だと発生しやすいです）。";
    return {
      httpStatus: 500,
      clientMessage:
        process.env.NODE_ENV === "development"
          ? `Prisma 検証エラー: ${err.message}${devHint}`
          : "保存データの形式がデータベースの定義と一致しません（スキーマ未反映の可能性）",
      logLine,
    };
  }

  if (err instanceof Error) {
    const logLine = `[Error] ${err.name}: ${err.message}`;
    return {
      httpStatus: 500,
      clientMessage: `サーバー内部エラー: ${err.message}`,
      logLine,
    };
  }

  return {
    httpStatus: 500,
    clientMessage: "サーバー内部で不明なエラーが発生しました",
    logLine: `[Unknown] ${String(err)}`,
  };
}
