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

function pick(env: Record<string, string>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = env[key]?.trim();
    if (v) return v;
  }
  return undefined;
}

async function checkDb(url: string | undefined): Promise<{ ok: boolean; detail: string }> {
  if (!url) return { ok: false, detail: "DATABASE_URL が未設定です" };
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient({ datasources: { db: { url } } });
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    return {
      ok: true,
      detail:
        url.includes("127.0.0.1") || url.includes("localhost")
          ? "ローカル DB に接続 OK"
          : "リモート DB に接続 OK",
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("Can't reach database")) {
      return {
        ok: false,
        detail: "DB に接続できません（Docker Desktop を起動して npm run db:local:up）",
      };
    }
    return { ok: false, detail: msg };
  }
}

async function main() {
  const env = loadEnvLocal();
  const mode = (env.STRIPE_MODE?.trim().toLowerCase() || "test") as string;
  const secret =
    mode === "live"
      ? pick(env, "STRIPE_SECRET_KEY_LIVE", "STRIPE_SECRET_KEY")
      : pick(env, "STRIPE_SECRET_KEY_TEST", "STRIPE_SECRET_KEY");
  const webhook =
    mode === "live"
      ? pick(env, "STRIPE_WEBHOOK_SECRET_LIVE", "STRIPE_WEBHOOK_SECRET")
      : pick(env, "STRIPE_WEBHOOK_SECRET_TEST", "STRIPE_WEBHOOK_SECRET");
  const forest = pick(
    env,
    mode === "live" ? "STRIPE_PRICE_FOREST_DELIVERY_LIVE" : "STRIPE_PRICE_FOREST_DELIVERY_TEST",
    "STRIPE_PRICE_FOREST_DELIVERY",
    mode === "live" ? "STRIPE_PRICE_LIGHT_LIVE" : "STRIPE_PRICE_LIGHT_TEST",
    "STRIPE_PRICE_LIGHT",
  );
  const acorn = pick(
    env,
    mode === "live" ? "STRIPE_PRICE_ACORN_50_LIVE" : "STRIPE_PRICE_ACORN_50_TEST",
    "STRIPE_PRICE_ACORN_50",
  );
  const checkoutEnabled = ["1", "true"].includes(
    (env.STRIPE_CHECKOUT_ENABLED ?? "").trim().toLowerCase(),
  );
  const appUrl = env.NEXT_PUBLIC_APP_URL?.trim() || "http://127.0.0.1:3000";

  console.log("=== LJD Stripe テスト環境チェック ===\n");
  console.log(`STRIPE_MODE: ${mode}`);
  console.log(
    `STRIPE_CHECKOUT_ENABLED: ${checkoutEnabled ? "true（ユーザー向け Checkout 許可）" : "false（準備中・確認用のみ）"}`,
  );

  if (!secret) {
    console.log("❌ STRIPE_SECRET_KEY(_TEST): 未設定");
  } else if (secret.startsWith("sk_test_")) {
    console.log("✅ secret key: テストモード (sk_test_...)");
  } else if (secret.startsWith("sk_live_")) {
    console.log("⚠️  secret key: 本番モード (sk_live_...) — テストには sk_test_ を使ってください");
  } else {
    console.log("❌ secret key: 形式が不明");
  }

  if (mode === "test" && secret?.startsWith("sk_live_")) {
    console.log("❌ test/live 混在: STRIPE_MODE=test なのに sk_live_");
  }
  if (mode === "live" && secret?.startsWith("sk_test_")) {
    console.log("❌ test/live 混在: STRIPE_MODE=live なのに sk_test_");
  }

  console.log(webhook ? "✅ webhook secret: 設定済み" : "❌ webhook secret: 未設定");

  if (!secret?.startsWith("sk_test_")) {
    console.log("\nStripe API の詳細確認はスキップしました。");
    process.exit(1);
  }

  const stripe = new Stripe(secret, { apiVersion: "2025-02-24.acacia" });

  for (const [label, priceId] of [
    ["STRIPE_PRICE_FOREST_DELIVERY / LIGHT", forest],
    ["STRIPE_PRICE_ACORN_50", acorn],
  ] as const) {
    if (!priceId) {
      console.log(`⚠️  ${label}: 未設定（test Checkout 確認時に必要）`);
      continue;
    }
    if (priceId.includes("_live")) {
      console.log(`❌ ${label}: live 風 ID が test に設定されています (${priceId})`);
      continue;
    }
    try {
      const price = await stripe.prices.retrieve(priceId);
      console.log(
        `✅ ${label}: ${price.id} (${price.recurring?.interval ?? "one_time"}, active=${price.active})`,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`❌ ${label}: ${msg}`);
    }
  }

  const db = await checkDb(env.DATABASE_URL);
  console.log(`${db.ok ? "✅" : "❌"} DATABASE: ${db.detail}`);

  try {
    const res = await fetch(`${appUrl.replace(/\/$/, "")}/api/health`, {
      signal: AbortSignal.timeout(5000),
    });
    console.log(`${res.ok ? "✅" : "⚠️ "} 開発サーバー (${appUrl}): HTTP ${res.status}`);
  } catch {
    console.log(`❌ 開発サーバー (${appUrl}): 応答なし — npm run dev を起動してください`);
  }

  console.log("\n--- test Checkout 確認（ローカル / 管理者）---");
  console.log("1. STRIPE_MODE=test / STRIPE_CHECKOUT_ENABLED=false");
  console.log("2. npm run stripe:listen（whsec が変わったら .env.local を更新）");
  console.log("3. npm run dev → /plans の「管理者・開発用（test Checkout）」から確認");
  console.log("4. ユーザー向け購入ボタンは「準備中」のまま（本番販売は開始しない）");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
