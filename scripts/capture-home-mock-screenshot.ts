/**
 * トップページ用モックスクショを 390px 幅で撮る。
 *
 * Chrome DevTools の Capture full size screenshot は、ウィンドウ幅の都合で
 * 203px など細い画像になることがある。Playwright なら幅を固定できる。
 *
 * 使い方:
 *   1. 別ターミナルで npm run dev を起動したままにする
 *   2. npx playwright install chromium   （初回だけ。うまくいかないときも再実行）
 *   3. npm run capture:home-mock journal
 *      または npm run capture:home-mock bookshelf
 *   4. 開いたブラウザで /login からログイン → 対象画面へ移動
 *   5. ターミナルで Enter → 撮影 → public/images/home-mock/ に保存
 *
 * 文字だけ表示されるとき:
 *   - npm run dev が動いているか確認
 *   - 下記は通常の Google Chrome を使う（Firebase ログイン向け）
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import readline from "node:readline";

import { chromium, type Browser } from "playwright";
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

async function assertDevServer(baseUrl: string): Promise<void> {
  try {
    const res = await fetch(`${baseUrl}/login`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const html = await res.text();
    if (!html.includes("/_next/")) {
      throw new Error("Next.js の静的ファイル参照が見つかりません");
    }
  } catch (error) {
    console.error("");
    console.error("開発サーバーに接続できませんでした。");
    console.error(`確認URL: ${baseUrl}/login`);
    console.error("");
    console.error("先に別ターミナルで、プロジェクトフォルダ内から次を実行してください:");
    console.error("  npm run dev");
    console.error("");
    console.error("「Ready」と表示されてから、もう一度 capture コマンドを実行してください。");
    console.error("");
    if (error instanceof Error) {
      console.error(`詳細: ${error.message}`);
    }
    process.exit(1);
  }
}

async function launchBrowser(): Promise<Browser> {
  const preferChrome = process.env.MOCK_CAPTURE_BROWSER?.trim() !== "chromium";

  if (preferChrome) {
    try {
      console.log("通常の Google Chrome で開きます（ログインしやすい設定）");
      return await chromium.launch({
        headless: false,
        channel: "chrome",
      });
    } catch {
      console.warn("Google Chrome が見つからないため、Playwright 付属ブラウザを使います。");
    }
  }

  console.log("Playwright 付属ブラウザで開きます");
  console.log("初回や表示がおかしいときは: npx playwright install chromium");
  return chromium.launch({ headless: false });
}

async function assertStylesLoaded(page: import("playwright").Page): Promise<void> {
  const stylesheetCount = await page.locator('link[rel="stylesheet"]').count();
  const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);

  if (stylesheetCount === 0) {
    console.warn("");
    console.warn("⚠ スタイルシートが読み込まれていません（文字だけの画面になっている可能性）");
    console.warn("  1. npm run dev が動いているか確認");
    console.warn("  2. ブラウザのアドレスが http://127.0.0.1:3000 か確認");
    console.warn("  3. うまくいかないときは npx playwright install chromium を再実行");
    console.warn("");
    return;
  }

  console.log(`スタイル読み込みOK（stylesheet: ${stylesheetCount}, body背景: ${bodyBg}）`);
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
  console.log(`ログイン後に開くページ: ${baseUrl}${target.path}`);
  console.log(`保存先: ${outputPath}`);
  console.log(`ビューポート: ${VIEWPORT_WIDTH} x ${VIEWPORT_HEIGHT}`);
  console.log("");

  await assertDevServer(baseUrl);

  const browser = await launchBrowser();
  const context = await browser.newContext({
    viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  console.log("まずログイン画面を開きます…");
  await page.goto(`${baseUrl}/login`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => undefined);
  await assertStylesLoaded(page);

  console.log("");
  console.log("次の操作をブラウザで行ってください:");
  console.log(`  1. ログインする（Google または メール）`);
  console.log(`  2. ${target.path} を開く（例: アドレスバーに ${baseUrl}${target.path}）`);
  console.log("  3. 画面がきちんと表示されたら、このターミナルに戻る");
  console.log("");

  await waitForEnter(
    "準備できたら Enter を押してください（今見えている画面を撮影します）… ",
  );

  await assertStylesLoaded(page);

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
    console.warn("⚠ 幅が 350px 未満です。表示が崩れている可能性があります。");
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
