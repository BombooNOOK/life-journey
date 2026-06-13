/**
 * トップページ用モックスクショを 390px 幅で撮る。
 *
 * Chrome DevTools の Capture full size screenshot は、ウィンドウ幅の都合で
 * 203px など細い画像になることがある。Playwright なら幅を固定できる。
 *
 * 使い方:
 *   1. npm run dev を別ターミナルで起動
 *   2. npm run capture:home-mock journal
 *      または npm run capture:home-mock bookshelf
 *   3. 開いたブラウザでログイン（必要なら）
 *   4. ターミナルで Enter → 撮影 → public/images/home-mock/ に保存
 *
 * 初回だけ: npx playwright install chromium
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import readline from "node:readline";

import { chromium } from "playwright";
import sharp from "sharp";

const VIEWPORT_WIDTH = 390;
const VIEWPORT_HEIGHT = 844;

const TARGETS = {
  journal: {
    path: "/journal",
    outputFile: "mock-journal-entry.png",
    label: "日記入力画面",
  },
  bookshelf: {
    path: "/orders/bookshelf",
    outputFile: "mock-bookshelf.png",
    label: "本棚画面",
  },
} as const;

type TargetKey = keyof typeof TARGETS;

function waitForEnter(prompt: string): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, () => {
      rl.close();
      resolve();
    });
  });
}

async function main() {
  const arg = (process.argv[2] ?? "journal") as TargetKey;
  const target = TARGETS[arg];

  if (!target) {
    console.error("使い方: npm run capture:home-mock [journal|bookshelf]");
    process.exit(1);
  }

  const baseUrl = process.env.MOCK_CAPTURE_BASE_URL?.trim() || "http://127.0.0.1:3000";
  const outputPath = join(process.cwd(), "public/images/home-mock", target.outputFile);
  mkdirSync(dirname(outputPath), { recursive: true });

  console.log(`対象: ${target.label}`);
  console.log(`URL: ${baseUrl}${target.path}`);
  console.log(`保存先: ${outputPath}`);
  console.log(`ビューポート: ${VIEWPORT_WIDTH} x ${VIEWPORT_HEIGHT}`);
  console.log("");

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  await page.goto(`${baseUrl}${target.path}`, { waitUntil: "networkidle" });

  await waitForEnter(
    "ブラウザでログイン・表示を整えたら Enter を押してください（撮影します）… ",
  );

  await page.screenshot({
    path: outputPath,
    fullPage: true,
    type: "png",
  });

  const meta = await sharp(outputPath).metadata();
  await browser.close();

  console.log("");
  console.log(`保存しました: ${outputPath}`);
  console.log(`画像サイズ: ${meta.width} x ${meta.height}px`);

  if (!meta.width || meta.width < 350) {
    console.warn("⚠ 幅が 350px 未満です。MOCK_CAPTURE_BASE_URL やログイン状態を確認してください。");
    process.exit(1);
  }

  console.log("");
  console.log("次の作業:");
  console.log(`  src/lib/home/homeProductMockAssets.ts の imageWidth / imageHeight を`);
  console.log(`  width=${meta.width}, height=${meta.height} に更新してください。`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
