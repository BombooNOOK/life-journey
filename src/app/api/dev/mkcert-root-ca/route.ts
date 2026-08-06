import fs from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readRootCaPem(): string | null {
  const localCopy = path.join(process.cwd(), ".certs/rootCA.pem");
  if (fs.existsSync(localCopy)) {
    return fs.readFileSync(localCopy, "utf8");
  }
  const caroot = spawnSync("mkcert", ["-CAROOT"], { encoding: "utf8" });
  const caPath = path.join((caroot.stdout || "").trim(), "rootCA.pem");
  if (fs.existsSync(caPath)) {
    return fs.readFileSync(caPath, "utf8");
  }
  return null;
}

/**
 * iPhone に mkcert ルート CA を渡すための開発専用エンドポイント。
 * ?format=cer で DER（iOS インストール向け）、省略時は PEM。
 * production では 404。
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const pem = readRootCaPem();
  if (!pem) {
    return NextResponse.json(
      { error: "rootCA.pem が見つかりません。先に npm run dev:lan:https を実行してください。" },
      { status: 404 },
    );
  }

  const url = new URL(request.url);
  const wantsCer = url.searchParams.get("format") === "cer";

  if (wantsCer) {
    const tmpPem = path.join(process.cwd(), ".certs/rootCA.pem");
    if (!fs.existsSync(tmpPem)) {
      fs.mkdirSync(path.dirname(tmpPem), { recursive: true });
      fs.writeFileSync(tmpPem, pem);
    }
    const tmpCer = path.join(process.cwd(), ".certs/rootCA.cer");
    const conv = spawnSync(
      "openssl",
      ["x509", "-in", tmpPem, "-outform", "DER", "-out", tmpCer],
      { encoding: "utf8" },
    );
    if (conv.status !== 0 || !fs.existsSync(tmpCer)) {
      return NextResponse.json(
        { error: "CER 変換に失敗しました", detail: conv.stderr },
        { status: 500 },
      );
    }
    const der = fs.readFileSync(tmpCer);
    return new NextResponse(der, {
      status: 200,
      headers: {
        "Content-Type": "application/x-x509-ca-cert",
        "Content-Disposition": 'attachment; filename="ljd-dev-rootCA.cer"',
        "Cache-Control": "no-store",
      },
    });
  }

  return new NextResponse(pem, {
    status: 200,
    headers: {
      "Content-Type": "application/x-pem-file",
      "Content-Disposition": 'attachment; filename="ljd-dev-rootCA.pem"',
      "Cache-Control": "no-store",
    },
  });
}
