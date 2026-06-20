/**
 * Stripe テスト環境の設定状態を確認します。
 * 使い方: npm run stripe:test-setup-check
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

import Stripe from "stripe";

function loadEnvLocal(): Record<string, string> {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const i = trimmed.indexOf("=");
    const key = trimmed.slice(0, i).trim();
    let val = trimmed.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

async function checkDb(url: string | undefined): Promise<{ ok: boolean; detail: string }> {
  if (!url) return { ok: false, detail: "DATABASE_URL が未設定です" };
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient({ datasources: { db: { url } } });
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    return { ok: true, detail: url.includes("127.0.0.1") || url.includes("localhost") ? "ローカル DB に接続 OK" : "リモート DB に接続 OK" };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("Can't reach database")) {
      return { ok: false, detail: "DB に接続できません（Docker Desktop を起動して npm run db:local:up）" };
    }
    return { ok: false, detail: msg };
  }
}

async function main() {
  const env = loadEnvLocal();
  const secret = env.STRIPE_SECRET_KEY?.trim();
  const light = env.STRIPE_PRICE_LIGHT?.trim();
  const standard = env.STRIPE_PRICE_STANDARD?.trim();
  const webhook = env.STRIPE_WEBHOOK_SECRET?.trim();
  const appUrl = env.NEXT_PUBLIC_APP_URL?.trim() || "http://127.0.0.1:3000";

  console.log("=== LJD Stripe テスト環境チェック ===\n");

  if (!secret) {
    console.log("❌ STRIPE_SECRET_KEY: 未設定");
  } else if (secret.startsWith("sk_test_")) {
    console.log("✅ STRIPE_SECRET_KEY: テストモード (sk_test_...)");
  } else if (secret.startsWith("sk_live_")) {
    console.log("⚠️  STRIPE_SECRET_KEY: 本番モード (sk_live_...) — テストには sk_test_ を使ってください");
  } else {
    console.log("❌ STRIPE_SECRET_KEY: 形式が不明");
  }

  console.log(webhook ? "✅ STRIPE_WEBHOOK_SECRET: 設定済み" : "❌ STRIPE_WEBHOOK_SECRET: 未設定");

  if (!secret?.startsWith("sk_test_")) {
    console.log("\nStripe API の詳細確認はスキップしました。");
    process.exit(1);
  }

  const stripe = new Stripe(secret, { apiVersion: "2025-02-24.acacia" });

  for (const [label, priceId] of [
    ["STRIPE_PRICE_LIGHT", light],
    ["STRIPE_PRICE_STANDARD", standard],
  ] as const) {
    if (!priceId) {
      console.log(`❌ ${label}: 未設定`);
      continue;
    }
    try {
      const price = await stripe.prices.retrieve(priceId);
      const ok = price.active === true;
      console.log(
        `${ok ? "✅" : "⚠️ "} ${label}: ${price.id} (${price.recurring?.interval ?? "?"}, active=${price.active})`,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`❌ ${label}: ${msg}`);
    }
  }

  const db = await checkDb(env.DATABASE_URL);
  console.log(`${db.ok ? "✅" : "❌"} DATABASE: ${db.detail}`);

  try {
    const res = await fetch(`${appUrl.replace(/\/$/, "")}/api/health`, { signal: AbortSignal.timeout(5000) });
    console.log(`${res.ok ? "✅" : "⚠️ "} 開発サーバー (${appUrl}): HTTP ${res.status}`);
  } catch {
    console.log(`❌ 開発サーバー (${appUrl}): 応答なし — npm run dev を起動してください`);
  }

  console.log("\n--- 解約テストの流れ（ローカル）---");
  console.log("1. Docker Desktop 起動 → npm run db:local:up");
  console.log("2. 別ターミナル: npm run stripe:listen（whsec が変わったら .env.local を更新）");
  console.log("3. npm run dev");
  console.log("4. ブラウザ: /login → /plans → テストカード 4242 4242 4242 4242");
  console.log("5. npm run db:local:stripe-status -- your@email.com");
  console.log("6. /orders/account で「有料プランを解約する」を確認");
  console.log("\n--- Preview で試す場合 ---");
  console.log("Preview URL の /plans から加入（Vercel の Stripe 環境変数が sk_test_ であること）");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
